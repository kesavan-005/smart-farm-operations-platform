package com.smartfarm.features.weather.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Data;

@Data
public class OpenMeteoResponseDto {
    private Double latitude;
    private Double longitude;
    private String timezone;
    @JsonProperty("timezone_abbreviation")
    private String timezoneAbbreviation;
    private CurrentData current;
    private HourlyData hourly;
    private DailyData daily;

    @Data
    public static class CurrentData {
        private String time;
        private Integer interval;

        @JsonProperty("temperature_2m")
        private Double temperature2m;

        @JsonProperty("apparent_temperature")
        private Double apparentTemperature;

        @JsonProperty("relative_humidity_2m")
        private Integer relativeHumidity2m;

        private Double precipitation;

        @JsonProperty("precipitation_probability")
        private Integer precipitationProbability;

        private Double rain;

        @JsonProperty("weather_code")
        private Integer weatherCode;

        @JsonProperty("wind_speed_10m")
        private Double windSpeed10m;

        @JsonProperty("wind_direction_10m")
        private Integer windDirection10m;

        @JsonProperty("wind_gusts_10m")
        private Double windGusts10m;
    }

    @Data
    public static class HourlyData {
        private List<String> time;

        @JsonProperty("temperature_2m")
        private List<Double> temperature2m;

        @JsonProperty("apparent_temperature")
        private List<Double> apparentTemperature;

        @JsonProperty("relative_humidity_2m")
        private List<Integer> relativeHumidity2m;

        private List<Double> precipitation;

        @JsonProperty("precipitation_probability")
        private List<Integer> precipitationProbability;

        private List<Double> rain;

        @JsonProperty("weather_code")
        private List<Integer> weatherCode;
    }

    @Data
    public static class DailyData {
        private List<String> time;

        @JsonProperty("weather_code")
        private List<Integer> weatherCode;

        @JsonProperty("temperature_2m_max")
        private List<Double> temperature2mMax;

        @JsonProperty("temperature_2m_min")
        private List<Double> temperature2mMin;

        @JsonProperty("rain_sum")
        private List<Double> rainSum;

        @JsonProperty("precipitation_hours")
        private List<Double> precipitationHours;

        @JsonProperty("precipitation_sum")
        private List<Double> precipitationSum;

        @JsonProperty("precipitation_probability_max")
        private List<Integer> precipitationProbabilityMax;

        private List<String> sunrise;
        private List<String> sunset;

        @JsonProperty("wind_speed_10m_max")
        private List<Double> windSpeed10mMax;
    }
}
