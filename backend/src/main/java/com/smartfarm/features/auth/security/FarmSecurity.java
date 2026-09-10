package com.smartfarm.features.auth.security;

import com.smartfarm.features.auth.domain.FarmModule;
import com.smartfarm.features.auth.domain.ModuleAccessLevel;
import com.smartfarm.features.auth.domain.SensitivePermission;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Slf4j
@Component("farmSecurity")
@RequiredArgsConstructor
public class FarmSecurity {

    private final FarmAuthorizationService farmAuthorizationService;

    /**
     * Standard method security check used across controllers: @PreAuthorize("@farmSecurity.canAccessFarm(#farmId)")
     */
    public boolean canAccessFarm(Authentication authentication, UUID farmId) {
        if (authentication == null || farmId == null) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UUID)) {
            return false;
        }

        UUID userId = (UUID) principal;
        return farmAuthorizationService.hasFarmAccess(userId, farmId);
    }

    public boolean canAccessFarm(UUID farmId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return canAccessFarm(authentication, farmId);
    }

    public boolean isOwner(UUID farmId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || farmId == null || !(authentication.getPrincipal() instanceof UUID userId)) {
            return false;
        }
        return farmAuthorizationService.isOwner(userId, farmId);
    }

    public boolean hasModuleAccess(UUID farmId, String moduleName, String levelName) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || farmId == null || !(authentication.getPrincipal() instanceof UUID userId)) {
            return false;
        }
        try {
            FarmModule module = FarmModule.valueOf(moduleName);
            ModuleAccessLevel level = ModuleAccessLevel.valueOf(levelName);
            return farmAuthorizationService.hasModuleAccess(userId, farmId, module, level);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid moduleName {} or levelName {}", moduleName, levelName);
            return false;
        }
    }

    public boolean hasSensitivePermission(UUID farmId, String permissionName) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || farmId == null || !(authentication.getPrincipal() instanceof UUID userId)) {
            return false;
        }
        try {
            SensitivePermission permission = SensitivePermission.valueOf(permissionName);
            return farmAuthorizationService.hasSensitivePermission(userId, farmId, permission);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid permissionName {}", permissionName);
            return false;
        }
    }
}
