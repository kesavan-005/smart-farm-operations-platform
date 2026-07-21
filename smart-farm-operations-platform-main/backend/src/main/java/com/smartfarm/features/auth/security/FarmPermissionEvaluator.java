package com.smartfarm.features.auth.security;

import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.UserFarmRole;
import com.smartfarm.features.auth.repository.UserFarmRoleRepository;
import java.io.Serializable;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("farmPermissionEvaluator")
@RequiredArgsConstructor
public class FarmPermissionEvaluator implements PermissionEvaluator {

    private final UserFarmRoleRepository userFarmRoleRepository;

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if ((authentication == null) || (targetDomainObject == null) || !(permission instanceof String)) {
            return false;
        }
        
        UUID userId = (UUID) authentication.getPrincipal();
        UUID farmId = (UUID) targetDomainObject;
        String requiredPermission = (String) permission;

        List<UserFarmRole> roles = userFarmRoleRepository.findByUserId(userId);
        
        return roles.stream()
                .filter(r -> r.getFarmId().equals(farmId))
                .anyMatch(r -> hasRolePermission(r.getRole(), requiredPermission));
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        if ((authentication == null) || (targetType == null) || !(permission instanceof String)) {
            return false;
        }
        
        UUID userId = (UUID) authentication.getPrincipal();
        UUID farmId = UUID.fromString(targetId.toString());
        String requiredPermission = (String) permission;
        
        List<UserFarmRole> roles = userFarmRoleRepository.findByUserId(userId);
        
        return roles.stream()
                .filter(r -> r.getFarmId().equals(farmId))
                .anyMatch(r -> hasRolePermission(r.getRole(), requiredPermission));
    }
    
    private boolean hasRolePermission(Role role, String requiredPermission) {
        // Simplified RBAC logic for the evaluator
        if (role == Role.OWNER) return true;
        if (role == Role.MANAGER) {
            return !requiredPermission.equals("DELETE_FARM") && !requiredPermission.equals("MANAGE_USERS");
        }
        if (role == Role.WORKER) {
            return requiredPermission.equals("READ") || requiredPermission.equals("ADD_ACTIVITY");
        }
        return false;
    }
}
