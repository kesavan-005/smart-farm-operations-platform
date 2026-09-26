package com.smartfarm.features.activity.controller;

import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.activity.dto.ActivityAssigneesResponse;
import com.smartfarm.features.activity.service.ActivityService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/farms/{farmId}")
@RequiredArgsConstructor
public class ActivityAssigneeController {

    private final ActivityService activityService;

    /**
     * Returns farm-scoped eligible workers and supervisors for activity assignment.
     * Only active farm members (from user_farm_roles) and the farm owner are included.
     * Soft-deleted or inactive users are excluded.
     */
    @GetMapping("/activity-assignees")
    @PreAuthorize("@farmSecurity.canAccessFarm(#farmId)")
    public ApiResponse<ActivityAssigneesResponse> getActivityAssignees(@PathVariable UUID farmId) {
        ActivityAssigneesResponse response = activityService.getActivityAssignees(farmId);
        return ApiResponse.success(response);
    }
}
