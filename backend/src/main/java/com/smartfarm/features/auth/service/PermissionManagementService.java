package com.smartfarm.features.auth.service;

import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.auth.domain.AuditLog;
import com.smartfarm.features.auth.domain.FarmMemberModuleAccess;
import com.smartfarm.features.auth.domain.FarmMemberSensitivePermission;
import com.smartfarm.features.auth.domain.FarmModule;
import com.smartfarm.features.auth.domain.ModuleAccessLevel;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.SensitivePermission;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.domain.UserFarmRole;
import com.smartfarm.features.auth.dto.AssignManagerRequest;
import com.smartfarm.features.auth.dto.FarmPermissionMatrixDTO;
import com.smartfarm.features.auth.dto.ManagerPermissionSummaryDTO;
import com.smartfarm.features.auth.dto.UpdateManagerPermissionsRequest;
import com.smartfarm.features.auth.dto.UserSummaryDTO;
import com.smartfarm.features.auth.repository.AuditLogRepository;
import com.smartfarm.features.auth.repository.FarmMemberModuleAccessRepository;
import com.smartfarm.features.auth.repository.FarmMemberSensitivePermissionRepository;
import com.smartfarm.features.auth.repository.UserFarmRoleRepository;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.auth.security.FarmAuthorizationService;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionManagementService {

    private final FarmAuthorizationService farmAuthorizationService;
    private final UserFarmRoleRepository userFarmRoleRepository;
    private final FarmMemberModuleAccessRepository moduleAccessRepository;
    private final FarmMemberSensitivePermissionRepository sensitivePermissionRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public FarmPermissionMatrixDTO getEffectivePermissions(UUID userId, UUID farmId) {
        return farmAuthorizationService.getEffectivePermissions(userId, farmId);
    }

    @Transactional(readOnly = true)
    public List<ManagerPermissionSummaryDTO> getFarmManagers(UUID farmId) {
        List<UserFarmRole> memberships = userFarmRoleRepository.findByFarmIdAndActiveTrue(farmId);

        return memberships.stream()
                .filter(m -> m.getRole() == Role.FARM_MANAGER)
                .map(this::toManagerSummaryDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDTO> searchEligibleManagers(UUID farmId, String query) {
        List<User> users = userRepository.findAll();
        List<UUID> currentActiveManagerUserIds = userFarmRoleRepository.findByFarmIdAndActiveTrue(farmId)
                .stream().map(m -> m.getUser().getId()).toList();

        String q = (query != null) ? query.toLowerCase().trim() : "";

        return users.stream()
                .filter(u -> u.getRole() == Role.FARM_MANAGER || u.getRole() == Role.WORKER || u.getRole() == Role.SUPERVISOR)
                .filter(u -> !currentActiveManagerUserIds.contains(u.getId()))
                .filter(u -> {
                    String displayName = getUserDisplayName(u).toLowerCase();
                    String email = u.getEmail() != null ? u.getEmail().toLowerCase() : "";
                    return q.isEmpty() || displayName.contains(q) || email.contains(q);
                })
                .map(u -> UserSummaryDTO.builder()
                        .id(u.getId())
                        .fullName(getUserDisplayName(u))
                        .email(u.getEmail())
                        .role(u.getRole())
                        .build())
                .toList();
    }

    @Transactional
    public ManagerPermissionSummaryDTO assignManager(UUID farmId, AssignManagerRequest request) {
        UUID targetUserId = request.getUserId();
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + targetUserId));

        Optional<UserFarmRole> existingOpt = userFarmRoleRepository.findByUserIdAndFarmId(targetUserId, farmId);

        UserFarmRole membership;
        if (existingOpt.isPresent()) {
            UserFarmRole existing = existingOpt.get();
            if (existing.isActive()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Manager is already assigned to this farm");
            } else {
                existing.setActive(true);
                existing.setRole(Role.FARM_MANAGER);
                membership = userFarmRoleRepository.save(existing);
                moduleAccessRepository.deleteByMembershipId(membership.getId());
                sensitivePermissionRepository.deleteByMembershipId(membership.getId());
            }
        } else {
            membership = UserFarmRole.builder()
                    .user(targetUser)
                    .farmId(farmId)
                    .role(Role.FARM_MANAGER)
                    .active(true)
                    .build();
            membership = userFarmRoleRepository.save(membership);
        }

        saveModuleAccessesAndSensitivePermissions(membership, request.getModuleAccess(), request.getSensitivePermissions());

        logAudit("MANAGER_ASSIGNED", String.format("{\"farmId\":\"%s\",\"managerUserId\":\"%s\",\"managerName\":\"%s\"}",
                farmId, targetUser.getId(), getUserDisplayName(targetUser)));

        return toManagerSummaryDTO(userFarmRoleRepository.findById(membership.getId()).orElse(membership));
    }

    @Transactional
    public ManagerPermissionSummaryDTO updateManagerPermissions(UUID farmId, UUID managerUserId, UpdateManagerPermissionsRequest request) {
        UserFarmRole membership = userFarmRoleRepository.findByUserIdAndFarmIdAndActiveTrue(managerUserId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Active manager membership not found for user: " + managerUserId));

        moduleAccessRepository.deleteByMembershipId(membership.getId());
        sensitivePermissionRepository.deleteByMembershipId(membership.getId());

        saveModuleAccessesAndSensitivePermissions(membership, request.getModuleAccess(), request.getSensitivePermissions());

        logAudit("MODULE_ACCESS_CHANGED", String.format("{\"farmId\":\"%s\",\"managerUserId\":\"%s\"}", farmId, managerUserId));

        return toManagerSummaryDTO(userFarmRoleRepository.findById(membership.getId()).orElse(membership));
    }

    @Transactional
    public void removeManager(UUID farmId, UUID managerUserId) {
        UserFarmRole membership = userFarmRoleRepository.findByUserIdAndFarmIdAndActiveTrue(managerUserId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Active manager membership not found for user: " + managerUserId));

        membership.setActive(false);
        userFarmRoleRepository.save(membership);

        logAudit("MANAGER_REMOVED", String.format("{\"farmId\":\"%s\",\"managerUserId\":\"%s\"}", farmId, managerUserId));
    }

    private void saveModuleAccessesAndSensitivePermissions(UserFarmRole membership,
                                                          Map<FarmModule, ModuleAccessLevel> moduleAccessMap,
                                                          List<SensitivePermission> sensitivePermissions) {
        if (moduleAccessMap != null) {
            List<FarmMemberModuleAccess> accesses = new ArrayList<>();
            for (FarmModule module : FarmModule.values()) {
                ModuleAccessLevel level = moduleAccessMap.getOrDefault(module, ModuleAccessLevel.NO_ACCESS);
                accesses.add(FarmMemberModuleAccess.builder()
                        .membership(membership)
                        .module(module)
                        .accessLevel(level)
                        .build());
            }
            moduleAccessRepository.saveAll(accesses);
        }

        if (sensitivePermissions != null && !sensitivePermissions.isEmpty()) {
            List<FarmMemberSensitivePermission> sensitives = sensitivePermissions.stream()
                    .map(sp -> FarmMemberSensitivePermission.builder()
                            .membership(membership)
                            .permission(sp)
                            .build())
                    .toList();
            sensitivePermissionRepository.saveAll(sensitives);
        }
    }

    private ManagerPermissionSummaryDTO toManagerSummaryDTO(UserFarmRole membership) {
        Map<FarmModule, ModuleAccessLevel> modules = new EnumMap<>(FarmModule.class);
        List<FarmMemberModuleAccess> accesses = moduleAccessRepository.findByMembershipId(membership.getId());

        for (FarmModule m : FarmModule.values()) {
            ModuleAccessLevel level = accesses.stream()
                    .filter(a -> a.getModule() == m)
                    .findFirst()
                    .map(FarmMemberModuleAccess::getAccessLevel)
                    .orElse(ModuleAccessLevel.NO_ACCESS);
            modules.put(m, level);
        }

        List<SensitivePermission> sensitives = sensitivePermissionRepository.findByMembershipId(membership.getId())
                .stream()
                .map(FarmMemberSensitivePermission::getPermission)
                .toList();

        return ManagerPermissionSummaryDTO.builder()
                .membershipId(membership.getId())
                .userId(membership.getUser().getId())
                .fullName(getUserDisplayName(membership.getUser()))
                .email(membership.getUser().getEmail())
                .role(membership.getRole())
                .active(membership.isActive())
                .moduleAccess(modules)
                .sensitivePermissions(sensitives)
                .grantedAt(membership.getGrantedAt())
                .build();
    }

    private String getUserDisplayName(User user) {
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName();
        }
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        String full = (first + " " + last).trim();
        return full.isEmpty() ? (user.getUsername() != null ? user.getUsername() : "User") : full;
    }

    private void logAudit(String action, String details) {
        try {
            AuditLog logEntry = AuditLog.builder()
                    .action(action)
                    .details(details)
                    .build();
            auditLogRepository.save(logEntry);
        } catch (Exception e) {
            log.warn("Failed to write audit log entry for action {}: {}", action, e.getMessage());
        }
    }
}
