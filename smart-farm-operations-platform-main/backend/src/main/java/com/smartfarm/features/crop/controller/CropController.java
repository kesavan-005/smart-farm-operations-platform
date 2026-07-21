package com.smartfarm.features.crop.controller;

import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.crop.dto.CropRequest;
import com.smartfarm.features.crop.dto.CropResponse;
import com.smartfarm.features.crop.service.CropService;
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
@RequestMapping("/api/v1/crops")
@RequiredArgsConstructor
public class CropController {

    private final CropService cropService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CropResponse> createCrop(
            @Valid @RequestBody CropRequest request,
            @AuthenticationPrincipal UUID userId) {
        CropResponse response = cropService.createCrop(request, userId);
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<CropResponse> getCropById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        CropResponse response = cropService.getCropById(id, userId);
        return ApiResponse.success(response);
    }

    @GetMapping
    public ApiResponse<Page<CropResponse>> getCrops(
            @RequestParam(required = false) UUID fieldId,
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
        Page<CropResponse> response = cropService.getCrops(userId, fieldId, search, status, pageable);
        return ApiResponse.success(response);
    }

    @PutMapping("/{id}")
    public ApiResponse<CropResponse> updateCrop(
            @PathVariable UUID id,
            @Valid @RequestBody CropRequest request,
            @AuthenticationPrincipal UUID userId) {
        CropResponse response = cropService.updateCrop(id, request, userId);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteCrop(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        cropService.deleteCrop(id, userId);
        return ApiResponse.success(null);
    }
}
