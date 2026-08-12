package com.smartfarm.features.activity.controller;

import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.activity.domain.ActivityPriority;
import com.smartfarm.features.activity.domain.ActivityStatus;
import com.smartfarm.features.activity.domain.ActivityType;
import com.smartfarm.features.activity.dto.ActivityRequest;
import com.smartfarm.features.activity.dto.ActivityResponse;
import com.smartfarm.features.activity.service.ActivityService;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
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
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ActivityResponse> createActivity(
            @Valid @RequestBody ActivityRequest request,
            @AuthenticationPrincipal UUID userId) {
        ActivityResponse response = activityService.createActivity(request, userId);
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<ActivityResponse> getActivityById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        ActivityResponse response = activityService.getActivityById(id, userId);
        return ApiResponse.success(response);
    }

    @GetMapping
    public ApiResponse<Page<ActivityResponse>> getActivities(
            @RequestParam(required = false) UUID farmId,
            @RequestParam(required = false) UUID fieldId,
            @RequestParam(required = false) UUID cropId,
            @RequestParam(required = false) ActivityType activityType,
            @RequestParam(required = false) ActivityStatus status,
            @RequestParam(required = false) ActivityPriority priority,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            @RequestParam(required = false) UUID assignedUserId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "scheduledDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @AuthenticationPrincipal UUID userId) {

        Sort sort = sortDirection.equalsIgnoreCase("asc") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ActivityResponse> response = activityService.getActivities(
                userId, farmId, fieldId, cropId, activityType, status, priority,
                startDate, endDate, assignedUserId, search, pageable
        );
        return ApiResponse.success(response);
    }

    @PutMapping("/{id}")
    public ApiResponse<ActivityResponse> updateActivity(
            @PathVariable UUID id,
            @Valid @RequestBody ActivityRequest request,
            @AuthenticationPrincipal UUID userId) {
        ActivityResponse response = activityService.updateActivity(id, request, userId);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteActivity(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        activityService.deleteActivity(id, userId);
        return ApiResponse.success(null);
    }
}
