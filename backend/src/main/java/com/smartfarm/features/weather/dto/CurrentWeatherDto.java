package com.smartfarm.features.weather.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentWeatherDto {
    private String time;
    private Double temperature;
    private Double apparentTemperature;
    private Integer humidity;
    private Integer precipitationProbability;
    private Double rain;
    private Double windSpeed;
    private Integer weatherCode;
}
