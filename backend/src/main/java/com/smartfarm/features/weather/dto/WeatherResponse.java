package com.smartfarm.features.weather.dto;

import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherResponse {
    private UUID farmId;
    private String farmName;
    private Double latitude;
    private Double longitude;
    private CurrentWeatherDto currentWeather;
    private DailyWeatherDto todayWeather;
    private List<HourlyWeatherDto> hourlyForecast;
    private List<DailyWeatherDto> dailyForecast;
    private List<String> alerts;
    private String cachedAt;
    private boolean stale;
}
