package com.smartfarm.features.auth.security;

import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.auth.domain.FarmMemberModuleAccess;
import com.smartfarm.features.auth.domain.FarmMemberSensitivePermission;
import com.smartfarm.features.auth.domain.FarmModule;
import com.smartfarm.features.auth.domain.ModuleAccessLevel;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.SensitivePermission;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.domain.UserFarmRole;
import com.smartfarm.features.auth.dto.FarmPermissionMatrixDTO;
import com.smartfarm.features.auth.repository.FarmMemberModuleAccessRepository;
import com.smartfarm.features.auth.repository.FarmMemberSensitivePermissionRepository;
import com.smartfarm.features.auth.repository.UserFarmRoleRepository;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FarmAuthorizationService {

    private final UserFarmRoleRepository userFarmRoleRepository;
    private final FarmMemberModuleAccessRepository moduleAccessRepository;
    private final FarmMemberSensitivePermissionRepository sensitivePermissionRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;

    /**
     * Checks if user is an active member of the given farm, or the owner, or direct farm user, or global ADMIN.
     */
    @Transactional(readOnly = true)
    public boolean hasFarmAccess(UUID userId, UUID farmId) {
        if (userId == null || farmId == null) return false;

        // 1. Global ADMIN check
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent() && userOpt.get().getRole() == Role.ADMIN) {
            return true;
        }

        // 2. Direct user farmId association
        if (userOpt.isPresent() && userOpt.get().getFarmId() != null && userOpt.get().getFarmId().equals(farmId)) {
            return true;
        }

        // 3. Farm owner check
        if (isOwner(userId, farmId)) {
            return true;
        }

        // 4. Active user_farm_roles membership check
        return userFarmRoleRepository.existsByUserIdAndFarmIdAndActiveTrue(userId, farmId);
    }

    /**
     * Verifies that userId is the actual owner of the specific farmId.
     * MUST NOT grant access purely based on global role without farm context verification.
     */
    @Transactional(readOnly = true)
    public boolean isOwner(UUID userId, UUID farmId) {
        if (userId == null || farmId == null) return false;

        Optional<Farm> farmOpt = farmRepository.findById(farmId);
        if (farmOpt.isPresent()) {
            Farm farm = farmOpt.get();
            if (farm.getOwner() != null && farm.getOwner().getId().equals(userId)) {
                return true;
            }
        }

        return userFarmRoleRepository.existsByUserIdAndFarmIdAndRoleAndActiveTrue(userId, farmId, Role.FARM_OWNER);
    }

    /**
     * Checks if user has required module access level for the target farm.
     * Enforces active membership (is_active = true) and returns false for missing records.
     */
    @Transactional(readOnly = true)
    public boolean hasModuleAccess(UUID userId, UUID farmId, FarmModule module, ModuleAccessLevel requiredLevel) {
        if (userId == null || farmId == null || module == null || requiredLevel == null) {
            return false;
        }

        // 1. Owner always has full access to owned farm
        if (isOwner(userId, farmId)) {
            return true;
        }

        // 2. Global ADMIN has full access
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent() && userOpt.get().getRole() == Role.ADMIN) {
            return true;
        }

        // 3. Must be an active member of the farm
        Optional<UserFarmRole> membershipOpt = userFarmRoleRepository.findByUserIdAndFarmIdAndActiveTrue(userId, farmId);
        if (membershipOpt.isEmpty()) {
            return false; // Inactive membership or non-member => DENY
        }

        UserFarmRole membership = membershipOpt.get();

        // 4. Legacy roles fallback (SUPERVISOR, WORKER, VIEWER)
        if (membership.getRole() != Role.FARM_MANAGER && membership.getRole() != Role.FARM_OWNER) {
            return checkLegacyRoleModuleAccess(membership.getRole(), module, requiredLevel);
        }

        // 5. Look up manager's module access record
        Optional<FarmMemberModuleAccess> accessOpt = moduleAccessRepository.findByMembershipIdAndModule(membership.getId(), module);

        ModuleAccessLevel actualLevel = accessOpt.map(FarmMemberModuleAccess::getAccessLevel)
                .orElse(ModuleAccessLevel.NO_ACCESS);

        return actualLevel.satisfies(requiredLevel);
    }

    /**
     * Checks if user has sensitive permission (e.g. INVENTORY_ADJUST).
     */
    @Transactional(readOnly = true)
    public boolean hasSensitivePermission(UUID userId, UUID farmId, SensitivePermission permission) {
        if (userId == null || farmId == null || permission == null) return false;

        if (isOwner(userId, farmId)) {
            return true;
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent() && userOpt.get().getRole() == Role.ADMIN) {
            return true;
        }

        Optional<UserFarmRole> membershipOpt = userFarmRoleRepository.findByUserIdAndFarmIdAndActiveTrue(userId, farmId);
        if (membershipOpt.isEmpty()) return false;

        return sensitivePermissionRepository.existsByMembershipIdAndPermission(membershipOpt.get().getId(), permission);
    }

    /**
     * Generates effective permission matrix for current user on the active farm.
     */
    @Transactional(readOnly = true)
    public FarmPermissionMatrixDTO getEffectivePermissions(UUID userId, UUID farmId) {
        if (isOwner(userId, farmId)) {
            return FarmPermissionMatrixDTO.createOwnerMatrix(farmId);
        }

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent() && userOpt.get().getRole() == Role.ADMIN) {
            return FarmPermissionMatrixDTO.createOwnerMatrix(farmId);
        }

        UserFarmRole membership = userFarmRoleRepository.findByUserIdAndFarmIdAndActiveTrue(userId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("No active farm membership found for farm: " + farmId));

        Map<FarmModule, ModuleAccessLevel> moduleLevels = new EnumMap<>(FarmModule.class);
        List<FarmMemberModuleAccess> accesses = moduleAccessRepository.findByMembershipId(membership.getId());

        for (FarmModule module : FarmModule.values()) {
            ModuleAccessLevel level = accesses.stream()
                    .filter(a -> a.getModule() == module)
                    .findFirst()
                    .map(FarmMemberModuleAccess::getAccessLevel)
                    .orElse(ModuleAccessLevel.NO_ACCESS);

            // If legacy role, fallback if no custom record configured
            if (accesses.isEmpty() && membership.getRole() != Role.FARM_MANAGER) {
                level = checkLegacyRoleModuleAccess(membership.getRole(), module, ModuleAccessLevel.FULL_ACCESS)
                        ? ModuleAccessLevel.FULL_ACCESS
                        : (checkLegacyRoleModuleAccess(membership.getRole(), module, ModuleAccessLevel.VIEW_ONLY)
                                ? ModuleAccessLevel.VIEW_ONLY
                                : ModuleAccessLevel.NO_ACCESS);
            }
            moduleLevels.put(module, level);
        }

        List<SensitivePermission> sensitive = sensitivePermissionRepository.findByMembershipId(membership.getId())
                .stream()
                .map(FarmMemberSensitivePermission::getPermission)
                .toList();

        return FarmPermissionMatrixDTO.builder()
                .farmId(farmId)
                .role(membership.getRole())
                .modules(moduleLevels)
                .sensitivePermissions(sensitive)
                .build();
    }

    private boolean checkLegacyRoleModuleAccess(Role role, FarmModule module, ModuleAccessLevel requiredLevel) {
        if (role == Role.SUPERVISOR) {
            // Supervisor has FULL_ACCESS to OPERATIONS, FARM_MANAGEMENT, INVENTORY, MONITORING; VIEW_ONLY to others
            if (module == FarmModule.OPERATIONS || module == FarmModule.FARM_MANAGEMENT || module == FarmModule.INVENTORY || module == FarmModule.MONITORING) {
                return true;
            }
            return requiredLevel == ModuleAccessLevel.VIEW_ONLY;
        }
        if (role == Role.WORKER) {
            // Worker has FULL_ACCESS to OPERATIONS; VIEW_ONLY to MONITORING, FARM_MANAGEMENT; NO_ACCESS to FINANCE
            if (module == FarmModule.OPERATIONS) return true;
            if (module == FarmModule.FINANCE) return false;
            return requiredLevel == ModuleAccessLevel.VIEW_ONLY;
        }
        if (role == Role.VIEWER) {
            return requiredLevel == ModuleAccessLevel.VIEW_ONLY;
        }
        return false;
    }
}
