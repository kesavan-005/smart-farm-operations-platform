package com.smartfarm.features.weather.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HourlyWeatherDto {
    private String time;
    private Double temperature;
    private Double apparentTemperature;
    private Double precipitation;
    private Integer precipitationProbability;
    private Double rain;
    private Integer weatherCode;
}
