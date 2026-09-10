package com.smartfarm.features.weather.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfarm.common.exception.LocationUnavailableException;
import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.weather.client.OpenMeteoClient;
import com.smartfarm.features.weather.dto.CurrentWeatherDto;
import com.smartfarm.features.weather.dto.DailyWeatherDto;
import com.smartfarm.features.weather.dto.HourlyWeatherDto;
import com.smartfarm.features.weather.dto.OpenMeteoResponseDto;
import com.smartfarm.features.weather.dto.WeatherResponse;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeatherService {

    private final FarmRepository farmRepository;
    private final OpenMeteoClient openMeteoClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${weather.cache.ttl-minutes:45}")
    private long cacheTtlMinutes = 45;

    // Optional RedisTemplate (null if RedisAutoConfiguration is excluded in dev profile)
    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    // In-memory fallback cache for development when Redis is disabled
    private final Map<String, LocalCacheEntry> localCache = new ConcurrentHashMap<>();

    private class LocalCacheEntry {
        final WeatherResponse data;
        final long timestamp;

        LocalCacheEntry(WeatherResponse data) {
            this.data = data;
            this.timestamp = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > TimeUnit.MINUTES.toMillis(cacheTtlMinutes);
        }
    }

    public WeatherResponse getWeatherForFarm(UUID farmId, UUID userId) {
        // 1. Fetch Farm
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));

        // 2. Verify Ownership
        if (!farm.getOwner().getId().equals(userId)) {
            throw new AccessDeniedException("Access denied to this farm");
        }

        return getWeatherForAuthorizedFarm(farm);
    }

    public WeatherResponse getWeatherForAuthorizedFarm(Farm farm) {
        // 3. Validate Coordinates
        Double lat = farm.getLatitude() != null ? farm.getLatitude().doubleValue() : null;
        Double lng = farm.getLongitude() != null ? farm.getLongitude().doubleValue() : null;
        if (lat == null || lng == null) {
            throw new LocationUnavailableException("Farm location coordinates are not set.");
        }
        if (lat < -90.0 || lat > 90.0 || lng < -180.0 || lng > 180.0) {
            throw new LocationUnavailableException("Farm location coordinates are invalid: lat=" + lat + ", lng=" + lng);
        }

        UUID farmId = farm.getId();
        String cacheKey = "weather:farm:" + farmId.toString();

        // 4. Try reading cache (Redis first, then local in-memory fallback)
        WeatherResponse cachedResponse = readFromCache(cacheKey);
        if (cachedResponse != null && !cachedResponse.isStale()) {
            log.debug("Returning cached weather for farm {}", farmId);
            return cachedResponse;
        }

        // 5. Call Open-Meteo API with diagnostic logging
        try {
            log.info("Fetching fresh weather from Open-Meteo for farmId={}, farmName='{}', latitude={}, longitude={}",
                    farmId, farm.getName(), lat, lng);
            OpenMeteoResponseDto omResponse = openMeteoClient.fetchForecast(lat, lng);
            if (omResponse != null) {
                log.info("Open-Meteo response received for farmId={}: timezone={}, latitude={}, longitude={}",
                        farmId, omResponse.getTimezone(), omResponse.getLatitude(), omResponse.getLongitude());
            }

            WeatherResponse freshResponse = buildWeatherResponse(farm, omResponse);

            // Store in Cache
            writeToCache(cacheKey, freshResponse);
            return freshResponse;
        } catch (Exception ex) {
            log.warn("Failed to fetch fresh weather from Open-Meteo for farm {}: {}", farmId, ex.getMessage());
            
            // If API call fails, return stale cached response if available
            if (cachedResponse != null) {
                cachedResponse.setStale(true);
                return cachedResponse;
            }
            throw new RuntimeException("Weather service currently unavailable.", ex);
        }
    }

    private WeatherResponse readFromCache(String cacheKey) {
        if (redisTemplate != null) {
            try {
                String json = redisTemplate.opsForValue().get(cacheKey);
                if (json != null) {
                    return objectMapper.readValue(json, WeatherResponse.class);
                }
            } catch (Exception e) {
                log.warn("Redis read failed, falling back to local cache: {}", e.getMessage());
            }
        }

        LocalCacheEntry entry = localCache.get(cacheKey);
        if (entry != null) {
            WeatherResponse resp = entry.data;
            resp.setStale(entry.isExpired());
            return resp;
        }
        return null;
    }

    private void writeToCache(String cacheKey, WeatherResponse response) {
        localCache.put(cacheKey, new LocalCacheEntry(response));

        if (redisTemplate != null) {
            try {
                String json = objectMapper.writeValueAsString(response);
                redisTemplate.opsForValue().set(cacheKey, json, cacheTtlMinutes, TimeUnit.MINUTES);
            } catch (Exception e) {
                log.warn("Redis write failed: {}", e.getMessage());
            }
        }
    }

    private WeatherResponse buildWeatherResponse(Farm farm, OpenMeteoResponseDto om) {
        CurrentWeatherDto currentWeather = null;
        DailyWeatherDto todayWeather = null;
        List<HourlyWeatherDto> hourlyList = new ArrayList<>();
        List<DailyWeatherDto> dailyList = new ArrayList<>();
        List<String> alerts = new ArrayList<>();

        // Map explicit Current Weather
        OpenMeteoResponseDto.CurrentData currentData = om.getCurrent();
        if (currentData != null) {
            Integer precipProb = currentData.getPrecipitationProbability();
            if (precipProb == null && om.getHourly() != null) {
                precipProb = getSafeInt(om.getHourly().getPrecipitationProbability(), 0);
            }

            currentWeather = CurrentWeatherDto.builder()
                    .time(currentData.getTime())
                    .temperature(currentData.getTemperature2m() != null ? currentData.getTemperature2m() : getSafeDouble(om.getHourly() != null ? om.getHourly().getTemperature2m() : null, 0))
                    .apparentTemperature(currentData.getApparentTemperature() != null ? currentData.getApparentTemperature() : getSafeDouble(om.getHourly() != null ? om.getHourly().getApparentTemperature() : null, 0))
                    .humidity(currentData.getRelativeHumidity2m() != null ? currentData.getRelativeHumidity2m() : getSafeInt(om.getHourly() != null ? om.getHourly().getRelativeHumidity2m() : null, 0))
                    .precipitationProbability(precipProb != null ? precipProb : 0)
                    .rain(currentData.getRain() != null ? currentData.getRain() : getSafeDouble(om.getHourly() != null ? om.getHourly().getRain() : null, 0))
                    .windSpeed(currentData.getWindSpeed10m() != null ? currentData.getWindSpeed10m() : 0.0)
                    .weatherCode(currentData.getWeatherCode() != null ? currentData.getWeatherCode() : getSafeInt(om.getHourly() != null ? om.getHourly().getWeatherCode() : null, 0))
                    .build();
        }

        // Map Hourly Forecast
        if (om.getHourly() != null && om.getHourly().getTime() != null && !om.getHourly().getTime().isEmpty()) {
            int count = Math.min(24, om.getHourly().getTime().size());
            for (int i = 0; i < count; i++) {
                HourlyWeatherDto h = HourlyWeatherDto.builder()
                        .time(om.getHourly().getTime().get(i))
                        .temperature(getSafeDouble(om.getHourly().getTemperature2m(), i))
                        .apparentTemperature(getSafeDouble(om.getHourly().getApparentTemperature(), i))
                        .precipitation(getSafeDouble(om.getHourly().getPrecipitation(), i))
                        .precipitationProbability(getSafeInt(om.getHourly().getPrecipitationProbability(), i))
                        .rain(getSafeDouble(om.getHourly().getRain(), i))
                        .weatherCode(getSafeInt(om.getHourly().getWeatherCode(), i))
                        .build();
                hourlyList.add(h);
            }

            // Fallback for current weather if explicit current block was completely absent from response
            if (currentWeather == null) {
                currentWeather = CurrentWeatherDto.builder()
                        .time(om.getHourly().getTime().get(0))
                        .temperature(getSafeDouble(om.getHourly().getTemperature2m(), 0))
                        .apparentTemperature(getSafeDouble(om.getHourly().getApparentTemperature(), 0))
                        .humidity(getSafeInt(om.getHourly().getRelativeHumidity2m(), 0))
                        .precipitationProbability(getSafeInt(om.getHourly().getPrecipitationProbability(), 0))
                        .rain(getSafeDouble(om.getHourly().getRain(), 0))
                        .windSpeed(0.0)
                        .weatherCode(getSafeInt(om.getHourly().getWeatherCode(), 0))
                        .build();
            }
        }

        if (om.getDaily() != null && om.getDaily().getTime() != null && !om.getDaily().getTime().isEmpty()) {
            for (int i = 0; i < om.getDaily().getTime().size(); i++) {
                DailyWeatherDto d = DailyWeatherDto.builder()
                        .date(om.getDaily().getTime().get(i))
                        .tempMax(getSafeDouble(om.getDaily().getTemperature2mMax(), i))
                        .tempMin(getSafeDouble(om.getDaily().getTemperature2mMin(), i))
                        .rainSum(getSafeDouble(om.getDaily().getRainSum(), i))
                        .precipitationProbabilityMax(getSafeInt(om.getDaily().getPrecipitationProbabilityMax(), i))
                        .windSpeedMax(getSafeDouble(om.getDaily().getWindSpeed10mMax(), i))
                        .weatherCode(getSafeInt(om.getDaily().getWeatherCode(), i))
                        .sunrise(getSafeString(om.getDaily().getSunrise(), i))
                        .sunset(getSafeString(om.getDaily().getSunset(), i))
                        .build();
                dailyList.add(d);
            }
            if (!dailyList.isEmpty()) {
                todayWeather = dailyList.get(0);

                // Deterministic Basic Alerts for Phase 1
                if (todayWeather.getPrecipitationProbabilityMax() != null && todayWeather.getPrecipitationProbabilityMax() >= 60) {
                    alerts.add("rainExpected");
                }
                if (todayWeather.getWindSpeedMax() != null && todayWeather.getWindSpeedMax() >= 30.0) {
                    alerts.add("strongWind");
                }
            }
        }

        return WeatherResponse.builder()
                .farmId(farm.getId())
                .farmName(farm.getName())
                .latitude(farm.getLatitude() != null ? farm.getLatitude().doubleValue() : null)
                .longitude(farm.getLongitude() != null ? farm.getLongitude().doubleValue() : null)
                .currentWeather(currentWeather)
                .todayWeather(todayWeather)
                .hourlyForecast(hourlyList)
                .dailyForecast(dailyList)
                .alerts(alerts)
                .cachedAt(DateTimeFormatter.ISO_INSTANT.format(Instant.now()))
                .stale(false)
                .build();
    }

    private Double getSafeDouble(List<Double> list, int index) {
        if (list != null && index >= 0 && index < list.size()) {
            return list.get(index);
        }
        return 0.0;
    }

    private Integer getSafeInt(List<Integer> list, int index) {
        if (list != null && index >= 0 && index < list.size()) {
            return list.get(index);
        }
        return 0;
    }

    private String getSafeString(List<String> list, int index) {
        if (list != null && index >= 0 && index < list.size()) {
            return list.get(index);
        }
        return "";
    }
}
