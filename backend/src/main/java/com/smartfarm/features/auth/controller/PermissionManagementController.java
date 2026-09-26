package com.smartfarm.features.auth.controller;

import com.smartfarm.features.auth.dto.AssignManagerRequest;
import com.smartfarm.features.auth.dto.FarmPermissionMatrixDTO;
import com.smartfarm.features.auth.dto.ManagerPermissionSummaryDTO;
import com.smartfarm.features.auth.dto.UpdateManagerPermissionsRequest;
import com.smartfarm.features.auth.dto.UserSummaryDTO;
import com.smartfarm.features.auth.service.PermissionManagementService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/permissions")
@RequiredArgsConstructor
@Tag(name = "Farm Permissions Management")
public class PermissionManagementController {

    private final PermissionManagementService permissionService;

    @GetMapping("/me")
    @PreAuthorize("@farmSecurity.canAccessFarm(#farmId)")
    public ResponseEntity<FarmPermissionMatrixDTO> getMyPermissions(
            @PathVariable UUID farmId,
            @AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(permissionService.getEffectivePermissions(userId, farmId));
    }

    @GetMapping("/managers")
    @PreAuthorize("@farmSecurity.isOwner(#farmId)")
    public ResponseEntity<List<ManagerPermissionSummaryDTO>> getFarmManagers(@PathVariable UUID farmId) {
        return ResponseEntity.ok(permissionService.getFarmManagers(farmId));
    }

    @GetMapping("/eligible-managers")
    @PreAuthorize("@farmSecurity.isOwner(#farmId)")
    public ResponseEntity<List<UserSummaryDTO>> searchEligibleManagers(
            @PathVariable UUID farmId,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(permissionService.searchEligibleManagers(farmId, query));
    }

    @PostMapping("/managers")
    @PreAuthorize("@farmSecurity.isOwner(#farmId)")
    public ResponseEntity<ManagerPermissionSummaryDTO> assignManager(
            @PathVariable UUID farmId,
            @Valid @RequestBody AssignManagerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(permissionService.assignManager(farmId, request));
    }

    @PutMapping("/managers/{managerUserId}")
    @PreAuthorize("@farmSecurity.isOwner(#farmId)")
    public ResponseEntity<ManagerPermissionSummaryDTO> updateManagerPermissions(
            @PathVariable UUID farmId,
            @PathVariable UUID managerUserId,
            @Valid @RequestBody UpdateManagerPermissionsRequest request) {
        return ResponseEntity.ok(permissionService.updateManagerPermissions(farmId, managerUserId, request));
    }

    @DeleteMapping("/managers/{managerUserId}")
    @PreAuthorize("@farmSecurity.isOwner(#farmId)")
    public ResponseEntity<Void> removeManager(
            @PathVariable UUID farmId,
            @PathVariable UUID managerUserId) {
        permissionService.removeManager(farmId, managerUserId);
        return ResponseEntity.noContent().build();
    }
}
