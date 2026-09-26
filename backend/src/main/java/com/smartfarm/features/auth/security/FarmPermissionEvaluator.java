package com.smartfarm.features.auth.security;

import com.smartfarm.features.auth.domain.FarmModule;
import com.smartfarm.features.auth.domain.ModuleAccessLevel;
import com.smartfarm.features.auth.domain.SensitivePermission;
import java.io.Serializable;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("farmPermissionEvaluator")
@RequiredArgsConstructor
public class FarmPermissionEvaluator implements PermissionEvaluator {

    private final FarmAuthorizationService farmAuthorizationService;

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || targetDomainObject == null || !(permission instanceof String)) {
            return false;
        }

        if (!(authentication.getPrincipal() instanceof UUID userId) || !(targetDomainObject instanceof UUID farmId)) {
            return false;
        }

        return evaluate(userId, farmId, (String) permission);
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        if (authentication == null || targetId == null || !(permission instanceof String)) {
            return false;
        }

        if (!(authentication.getPrincipal() instanceof UUID userId)) {
            return false;
        }

        UUID farmId;
        try {
            farmId = UUID.fromString(targetId.toString());
        } catch (IllegalArgumentException e) {
            return false;
        }

        return evaluate(userId, farmId, (String) permission);
    }

    private boolean evaluate(UUID userId, UUID farmId, String permissionStr) {
        if (permissionStr.startsWith("SENSITIVE:")) {
            String sensitiveName = permissionStr.substring("SENSITIVE:".length());
            try {
                SensitivePermission sensitivePermission = SensitivePermission.valueOf(sensitiveName);
                return farmAuthorizationService.hasSensitivePermission(userId, farmId, sensitivePermission);
            } catch (IllegalArgumentException e) {
                return false;
            }
        }

        if (permissionStr.contains(":")) {
            String[] parts = permissionStr.split(":");
            try {
                FarmModule module = FarmModule.valueOf(parts[0]);
                ModuleAccessLevel level = ModuleAccessLevel.valueOf(parts[1]);
                return farmAuthorizationService.hasModuleAccess(userId, farmId, module, level);
            } catch (IllegalArgumentException e) {
                // continue to general access
            }
        }

        return farmAuthorizationService.hasFarmAccess(userId, farmId);
    }
}
