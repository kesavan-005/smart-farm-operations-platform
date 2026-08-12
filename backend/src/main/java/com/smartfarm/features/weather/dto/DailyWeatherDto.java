package com.smartfarm.features.weather.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyWeatherDto {
    private String date;
    private Double tempMax;
    private Double tempMin;
    private Double rainSum;
    private Integer precipitationProbabilityMax;
    private Double windSpeedMax;
    private Integer weatherCode;
    private String sunrise;
    private String sunset;
}
