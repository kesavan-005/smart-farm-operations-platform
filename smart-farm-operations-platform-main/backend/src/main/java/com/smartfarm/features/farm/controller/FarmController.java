package com.smartfarm.features.farm.controller;

import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.farm.dto.FarmRequest;
import com.smartfarm.features.farm.dto.FarmResponse;
import com.smartfarm.features.farm.service.FarmService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/farms")
@RequiredArgsConstructor
public class FarmController {

    private final FarmService farmService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FarmResponse> createFarm(
            @Valid @RequestBody FarmRequest request,
            @AuthenticationPrincipal UUID userId) {
        FarmResponse response = farmService.createFarm(request, userId);
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<FarmResponse> getFarmById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        FarmResponse response = farmService.getFarmById(id, userId);
        return ApiResponse.success(response);
    }

    @GetMapping
    public ApiResponse<Page<FarmResponse>> getFarms(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection,
            @AuthenticationPrincipal UUID userId) {
        
        Sort sort = sortDirection.equalsIgnoreCase("desc") 
                ? Sort.by(sortBy).descending() 
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<FarmResponse> response = farmService.getFarms(userId, search, status, pageable);
        return ApiResponse.success(response);
    }

    @PutMapping("/{id}")
    public ApiResponse<FarmResponse> updateFarm(
            @PathVariable UUID id,
            @Valid @RequestBody FarmRequest request,
            @AuthenticationPrincipal UUID userId) {
        FarmResponse response = farmService.updateFarm(id, request, userId);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteFarm(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        farmService.deleteFarm(id, userId);
        return ApiResponse.success(null);
    }
}
