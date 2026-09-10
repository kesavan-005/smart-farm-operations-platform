package com.smartfarm.features.advisory.controller;

import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.advisory.dto.AdvisoryRequest;
import com.smartfarm.features.advisory.dto.AdvisoryResponse;
import com.smartfarm.features.advisory.service.AdvisoryOrchestrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/advisory")
@RequiredArgsConstructor
public class AdvisoryController {

    private final AdvisoryOrchestrationService advisoryOrchestrationService;

    @PostMapping
    public ApiResponse<AdvisoryResponse> generateAdvisory(
            @PathVariable UUID farmId,
            @Valid @RequestBody AdvisoryRequest request,
            @AuthenticationPrincipal UUID userId) {
        
        // Critical: The farmId in the URL path is authoritative. 
        // We override any farmId provided in the JSON body payload to prevent ID spoofing.
        request.setFarmId(farmId);
        
        AdvisoryResponse response = advisoryOrchestrationService.generateAdvisory(request, userId);
        return ApiResponse.success(response);
    }
}
