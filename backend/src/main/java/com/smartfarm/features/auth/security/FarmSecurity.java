package com.smartfarm.features.auth.security;

import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.auth.repository.UserFarmRoleRepository;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component("farmSecurity")
@RequiredArgsConstructor
public class FarmSecurity {

    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final UserFarmRoleRepository userFarmRoleRepository;

    /**
     * Checks if the authenticated user has access to read/write farm data.
     * Access is granted if the user is a global ADMIN, is associated with the farm directly,
     * is the owner of the farm, or has a mapped role for the specific farm in user_farm_roles.
     */
    public boolean canAccessFarm(Authentication authentication, UUID farmId) {
        log.info("canAccessFarm called with farmId: {} and authentication: {}", farmId, authentication);
        if (authentication == null || farmId == null) {
            log.warn("Authentication or farmId is null");
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UUID)) {
            log.warn("Principal is not UUID: {}", principal);
            return false;
        }
        UUID userId = (UUID) principal;
        log.info("userId from principal: {}", userId);

        // 1. Global ADMINs or users directly associated with the farm have access
        var userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            var user = userOpt.get();
            log.info("User found: {}, role: {}, farmId: {}", user.getEmail(), user.getRole(), user.getFarmId());
            if (user.getRole() == Role.ADMIN) {
                log.info("Access granted: User is ADMIN");
                return true;
            }
            if (user.getFarmId() != null && user.getFarmId().equals(farmId)) {
                log.info("Access granted: User has direct association with this farm");
                return true;
            }
        } else {
            log.warn("User not found in repository for userId: {}", userId);
        }

        // 2. Owners of the farm have access
        var farmOpt = farmRepository.findById(farmId);
        if (farmOpt.isPresent()) {
            Farm farm = farmOpt.get();
            log.info("Farm found: {}, owner: {}", farm.getName(), farm.getOwner() != null ? farm.getOwner().getId() : "null");
            if (farm.getOwner() != null && farm.getOwner().getId().equals(userId)) {
                log.info("Access granted: User is owner of the farm");
                return true;
            }
        } else {
            log.warn("Farm not found in repository for farmId: {}", farmId);
            throw new ResourceNotFoundException("Farm not found with ID: " + farmId);
        }

        // 3. Mapped users in user_farm_roles have access
        boolean hasMappedRole = userFarmRoleRepository.findByUserId(userId).stream()
                .anyMatch(r -> r.getFarmId().equals(farmId));
        log.info("Access check via user_farm_roles: {}", hasMappedRole);
        return hasMappedRole;
    }
}
