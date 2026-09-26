package com.smartfarm.features.farm.controller;

import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.farm.dto.context.FarmContextResponse;
import com.smartfarm.features.farm.service.FarmContextService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/farms")
@RequiredArgsConstructor
@Tag(name = "Farm Context", description = "Digital Farm Twin APIs")
public class FarmContextController {

    private final FarmContextService farmContextService;

    @GetMapping("/{farmId}/context")
    @Operation(summary = "Get farm context", description = "Retrieves the aggregated digital twin context of the farm")
    public ApiResponse<FarmContextResponse> getFarmContext(
            @PathVariable UUID farmId,
            @AuthenticationPrincipal UUID userId) {
        FarmContextResponse response = farmContextService.getFarmContext(farmId, userId);
        return ApiResponse.success(response);
    }
}
