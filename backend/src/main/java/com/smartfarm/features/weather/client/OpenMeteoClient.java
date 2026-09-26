package com.smartfarm.features.weather.client;

import com.smartfarm.features.weather.dto.OpenMeteoResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Slf4j
@Component
public class OpenMeteoClient {

    private final RestTemplate restTemplate;

    public OpenMeteoClient() {
        this.restTemplate = new RestTemplate();
    }

    public OpenMeteoResponseDto fetchForecast(double latitude, double longitude) {
        String url = UriComponentsBuilder.fromHttpUrl("https://api.open-meteo.com/v1/forecast")
                .queryParam("latitude", latitude)
                .queryParam("longitude", longitude)
                .queryParam("current", "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m")
                .queryParam("hourly", "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,rain,weather_code")
                .queryParam("daily", "temperature_2m_max,temperature_2m_min,rain_sum,precipitation_hours,precipitation_sum,precipitation_probability_max,weather_code,sunrise,sunset,wind_speed_10m_max")
                .queryParam("timezone", "auto")
                .queryParam("forecast_days", 7)
                .toUriString();

        log.debug("Calling Open-Meteo API for coordinates ({}, {}): {}", latitude, longitude, url);

        try {
            return restTemplate.getForObject(url, OpenMeteoResponseDto.class);
        } catch (Exception e) {
            log.error("Failed to fetch weather forecast from Open-Meteo: {}", e.getMessage(), e);
            throw new RuntimeException("Unable to fetch weather from external provider", e);
        }
    }
}
