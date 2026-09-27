package com.smartfarm.features.weather.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartfarm.common.exception.LocationUnavailableException;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.weather.client.OpenMeteoClient;
import com.smartfarm.features.weather.dto.OpenMeteoResponseDto;
import com.smartfarm.features.weather.dto.WeatherResponse;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Phase 2.8.7 - Weather Service Failure Resilience and Caching Hardening Tests")
class WeatherServiceHardeningTest {

    private FarmRepository farmRepository;
    private OpenMeteoClient openMeteoClient;
    private WeatherService weatherService;

    private Farm farm;
    private UUID farmId;

    @BeforeEach
    void setUp() {
        farmRepository = mock(FarmRepository.class);
        openMeteoClient = mock(OpenMeteoClient.class);
        weatherService = new WeatherService(farmRepository, openMeteoClient);

        farmId = UUID.randomUUID();
        farm = Farm.builder()
                .id(farmId)
                .name("Coimbatore Test Farm")
                .latitude(BigDecimal.valueOf(11.0168))
                .longitude(BigDecimal.valueOf(76.9558))
                .build();
    }

    @Test
    @DisplayName("Open-Meteo success: Fetches fresh weather, parses metrics, and computes rain alert")
    void openMeteoSuccess() {
        OpenMeteoResponseDto dto = new OpenMeteoResponseDto();
        dto.setTimezone("Asia/Kolkata");
        dto.setLatitude(11.0168);
        dto.setLongitude(76.9558);

        OpenMeteoResponseDto.CurrentData current = new OpenMeteoResponseDto.CurrentData();
        current.setTime("2026-09-28T10:00");
        current.setTemperature2m(31.2);
        current.setRelativeHumidity2m(68);
        current.setPrecipitation(15.5);
        current.setWindSpeed10m(12.4);
        current.setWeatherCode(61);
        dto.setCurrent(current);

        OpenMeteoResponseDto.DailyData daily = new OpenMeteoResponseDto.DailyData();
        daily.setTime(List.of("2026-09-28"));
        daily.setWeatherCode(List.of(61));
        daily.setTemperature2mMax(List.of(33.0));
        daily.setTemperature2mMin(List.of(24.0));
        daily.setRainSum(List.of(15.5));
        daily.setPrecipitationProbabilityMax(List.of(85));
        daily.setWindSpeed10mMax(List.of(15.0));
        dto.setDaily(daily);

        when(openMeteoClient.fetchForecast(anyDouble(), anyDouble())).thenReturn(dto);

        WeatherResponse response = weatherService.getWeatherForAuthorizedFarm(farm);

        assertThat(response).isNotNull();
        assertThat(response.getCurrentWeather().getTemperature()).isEqualTo(31.2);
        assertThat(response.getCurrentWeather().getHumidity()).isEqualTo(68);
        assertThat(response.getAlerts()).contains("rainExpected");
    }

    @Test
    @DisplayName("Missing farm coordinates: Throws LocationUnavailableException without calling Open-Meteo")
    void missingCoordinatesThrowsLocationUnavailableException() {
        farm.setLatitude(null);
        farm.setLongitude(null);

        assertThatThrownBy(() -> weatherService.getWeatherForAuthorizedFarm(farm))
                .isInstanceOf(LocationUnavailableException.class)
                .hasMessageContaining("Farm location coordinates are not set");

        verify(openMeteoClient, never()).fetchForecast(anyDouble(), anyDouble());
    }

    @Test
    @DisplayName("Invalid out-of-range coordinates: Throws LocationUnavailableException")
    void invalidCoordinatesThrowsLocationUnavailableException() {
        farm.setLatitude(BigDecimal.valueOf(95.0)); // Out of -90 to +90
        farm.setLongitude(BigDecimal.valueOf(76.0));

        assertThatThrownBy(() -> weatherService.getWeatherForAuthorizedFarm(farm))
                .isInstanceOf(LocationUnavailableException.class)
                .hasMessageContaining("Farm location coordinates are invalid");

        verify(openMeteoClient, never()).fetchForecast(anyDouble(), anyDouble());
    }

    @Test
    @DisplayName("In-memory fallback cache: Works seamlessly when Redis is absent and caches responses")
    void inMemoryCacheFallbackWhenRedisAbsent() {
        OpenMeteoResponseDto dto = new OpenMeteoResponseDto();
        OpenMeteoResponseDto.CurrentData current = new OpenMeteoResponseDto.CurrentData();
        current.setTime("2026-09-28T10:00");
        current.setTemperature2m(28.0);
        current.setRelativeHumidity2m(60);
        current.setPrecipitation(0.0);
        current.setWindSpeed10m(8.0);
        current.setWeatherCode(1);
        dto.setCurrent(current);

        OpenMeteoResponseDto.DailyData daily = new OpenMeteoResponseDto.DailyData();
        daily.setTime(List.of("2026-09-28"));
        daily.setWeatherCode(List.of(1));
        daily.setTemperature2mMax(List.of(30.0));
        daily.setTemperature2mMin(List.of(22.0));
        daily.setRainSum(List.of(0.0));
        daily.setPrecipitationProbabilityMax(List.of(10));
        daily.setWindSpeed10mMax(List.of(10.0));
        dto.setDaily(daily);

        when(openMeteoClient.fetchForecast(anyDouble(), anyDouble())).thenReturn(dto);

        // First call: calls Open-Meteo
        WeatherResponse resp1 = weatherService.getWeatherForAuthorizedFarm(farm);
        assertThat(resp1).isNotNull();

        // Second call: serves from in-memory cache
        WeatherResponse resp2 = weatherService.getWeatherForAuthorizedFarm(farm);
        assertThat(resp2).isNotNull();
        assertThat(resp2.getCurrentWeather().getTemperature()).isEqualTo(28.0);

        // Verify Open-Meteo client was called ONLY ONCE
        verify(openMeteoClient, times(1)).fetchForecast(anyDouble(), anyDouble());
    }

    @Test
    @DisplayName("Open-Meteo failure: Throws exception and does not fabricate weather data")
    void openMeteoFailureDoesNotFabricateWeather() {
        when(openMeteoClient.fetchForecast(anyDouble(), anyDouble()))
                .thenThrow(new RuntimeException("503 Service Unavailable"));

        assertThatThrownBy(() -> weatherService.getWeatherForAuthorizedFarm(farm))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Weather service currently unavailable.")
                .hasRootCauseMessage("503 Service Unavailable");
    }
}
