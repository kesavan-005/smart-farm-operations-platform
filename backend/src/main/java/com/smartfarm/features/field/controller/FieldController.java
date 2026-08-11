package com.smartfarm.features.field.controller;

import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.field.dto.FieldRequest;
import com.smartfarm.features.field.dto.FieldResponse;
import com.smartfarm.features.field.service.FieldService;
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
@RequestMapping("/api/v1/fields")
@RequiredArgsConstructor
public class FieldController {

    private final FieldService fieldService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FieldResponse> createField(
            @Valid @RequestBody FieldRequest request,
            @AuthenticationPrincipal UUID userId) {
        FieldResponse response = fieldService.createField(request, userId);
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<FieldResponse> getFieldById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        FieldResponse response = fieldService.getFieldById(id, userId);
        return ApiResponse.success(response);
    }

    @GetMapping
    public ApiResponse<Page<FieldResponse>> getFields(
            @RequestParam(required = false) UUID farmId,
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
        Page<FieldResponse> response = fieldService.getFields(userId, farmId, search, status, pageable);
        return ApiResponse.success(response);
    }

    @PutMapping("/{id}")
    public ApiResponse<FieldResponse> updateField(
            @PathVariable UUID id,
            @Valid @RequestBody FieldRequest request,
            @AuthenticationPrincipal UUID userId) {
        FieldResponse response = fieldService.updateField(id, request, userId);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteField(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        fieldService.deleteField(id, userId);
        return ApiResponse.success(null);
    }
}
