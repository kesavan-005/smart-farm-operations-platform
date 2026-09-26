package com.smartfarm.features.weather.controller;

import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.weather.dto.WeatherResponse;
import com.smartfarm.features.weather.service.WeatherService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/farms")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping("/{farmId}/weather")
    public ResponseEntity<ApiResponse<WeatherResponse>> getFarmWeather(
            @PathVariable UUID farmId,
            @AuthenticationPrincipal UUID userId) {
        WeatherResponse response = weatherService.getWeatherForFarm(farmId, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
