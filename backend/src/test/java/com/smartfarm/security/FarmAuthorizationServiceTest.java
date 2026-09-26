package com.smartfarm.security;

import com.smartfarm.features.auth.domain.FarmMemberModuleAccess;
import com.smartfarm.features.auth.domain.FarmModule;
import com.smartfarm.features.auth.domain.ModuleAccessLevel;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.SensitivePermission;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.domain.UserFarmRole;
import com.smartfarm.features.auth.repository.FarmMemberModuleAccessRepository;
import com.smartfarm.features.auth.repository.FarmMemberSensitivePermissionRepository;
import com.smartfarm.features.auth.repository.UserFarmRoleRepository;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.auth.security.FarmAuthorizationService;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FarmAuthorizationServiceTest {

    @Mock
    private UserFarmRoleRepository userFarmRoleRepository;

    @Mock
    private FarmMemberModuleAccessRepository moduleAccessRepository;

    @Mock
    private FarmMemberSensitivePermissionRepository sensitivePermissionRepository;

    @Mock
    private FarmRepository farmRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FarmAuthorizationService farmAuthorizationService;

    private UUID userId;
    private UUID farmAId;
    private UUID farmBId;
    private User ownerUser;
    private Farm farmA;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        farmAId = UUID.randomUUID();
        farmBId = UUID.randomUUID();

        ownerUser = User.builder().id(userId).email("owner@test.com").role(Role.FARM_OWNER).build();
        farmA = Farm.builder().id(farmAId).name("Farm A").owner(ownerUser).build();
    }

    @Test
    void isOwner_ShouldReturnTrue_WhenUserIsActualOwnerOfFarmA() {
        when(farmRepository.findById(farmAId)).thenReturn(Optional.of(farmA));

        assertTrue(farmAuthorizationService.isOwner(userId, farmAId));
    }

    @Test
    void isOwner_ShouldReturnFalse_WhenUserRequestsFarmBWithoutOwnership() {
        when(farmRepository.findById(farmBId)).thenReturn(Optional.empty());
        when(userFarmRoleRepository.existsByUserIdAndFarmIdAndRoleAndActiveTrue(userId, farmBId, Role.FARM_OWNER)).thenReturn(false);

        assertFalse(farmAuthorizationService.isOwner(userId, farmBId));
    }

    @Test
    void hasModuleAccess_ShouldReturnFalse_WhenMembershipIsInactive() {
        UUID managerId = UUID.randomUUID();
        when(farmRepository.findById(farmAId)).thenReturn(Optional.of(farmA)); // farmA owner is userId, not managerId
        when(userRepository.findById(managerId)).thenReturn(Optional.empty());
        when(userFarmRoleRepository.findByUserIdAndFarmIdAndActiveTrue(managerId, farmAId)).thenReturn(Optional.empty());

        assertFalse(farmAuthorizationService.hasModuleAccess(managerId, farmAId, FarmModule.FINANCE, ModuleAccessLevel.VIEW_ONLY));
    }

    @Test
    void hasModuleAccess_ShouldReturnTrue_WhenManagerHasFullAccess() {
        UUID managerId = UUID.randomUUID();
        UUID membershipId = UUID.randomUUID();
        UserFarmRole membership = UserFarmRole.builder()
                .id(membershipId)
                .farmId(farmAId)
                .role(Role.FARM_MANAGER)
                .active(true)
                .build();

        FarmMemberModuleAccess access = FarmMemberModuleAccess.builder()
                .membership(membership)
                .module(FarmModule.FINANCE)
                .accessLevel(ModuleAccessLevel.FULL_ACCESS)
                .build();

        when(farmRepository.findById(farmAId)).thenReturn(Optional.of(farmA));
        when(userRepository.findById(managerId)).thenReturn(Optional.empty());
        when(userFarmRoleRepository.findByUserIdAndFarmIdAndActiveTrue(managerId, farmAId)).thenReturn(Optional.of(membership));
        when(moduleAccessRepository.findByMembershipIdAndModule(membershipId, FarmModule.FINANCE)).thenReturn(Optional.of(access));

        assertTrue(farmAuthorizationService.hasModuleAccess(managerId, farmAId, FarmModule.FINANCE, ModuleAccessLevel.VIEW_ONLY));
        assertTrue(farmAuthorizationService.hasModuleAccess(managerId, farmAId, FarmModule.FINANCE, ModuleAccessLevel.FULL_ACCESS));
    }

    @Test
    void hasModuleAccess_ShouldReturnFalse_WhenManagerHasViewOnly_AndRequestsFullAccess() {
        UUID managerId = UUID.randomUUID();
        UUID membershipId = UUID.randomUUID();
        UserFarmRole membership = UserFarmRole.builder()
                .id(membershipId)
                .farmId(farmAId)
                .role(Role.FARM_MANAGER)
                .active(true)
                .build();

        FarmMemberModuleAccess access = FarmMemberModuleAccess.builder()
                .membership(membership)
                .module(FarmModule.FINANCE)
                .accessLevel(ModuleAccessLevel.VIEW_ONLY)
                .build();

        when(farmRepository.findById(farmAId)).thenReturn(Optional.of(farmA));
        when(userRepository.findById(managerId)).thenReturn(Optional.empty());
        when(userFarmRoleRepository.findByUserIdAndFarmIdAndActiveTrue(managerId, farmAId)).thenReturn(Optional.of(membership));
        when(moduleAccessRepository.findByMembershipIdAndModule(membershipId, FarmModule.FINANCE)).thenReturn(Optional.of(access));

        assertTrue(farmAuthorizationService.hasModuleAccess(managerId, farmAId, FarmModule.FINANCE, ModuleAccessLevel.VIEW_ONLY));
        assertFalse(farmAuthorizationService.hasModuleAccess(managerId, farmAId, FarmModule.FINANCE, ModuleAccessLevel.FULL_ACCESS));
    }

    @Test
    void hasSensitivePermission_ShouldCheckRepository() {
        UUID managerId = UUID.randomUUID();
        UUID membershipId = UUID.randomUUID();
        UserFarmRole membership = UserFarmRole.builder()
                .id(membershipId)
                .farmId(farmAId)
                .role(Role.FARM_MANAGER)
                .active(true)
                .build();

        when(farmRepository.findById(farmAId)).thenReturn(Optional.of(farmA));
        when(userRepository.findById(managerId)).thenReturn(Optional.empty());
        when(userFarmRoleRepository.findByUserIdAndFarmIdAndActiveTrue(managerId, farmAId)).thenReturn(Optional.of(membership));
        when(sensitivePermissionRepository.existsByMembershipIdAndPermission(membershipId, SensitivePermission.INVENTORY_ADJUST)).thenReturn(true);

        assertTrue(farmAuthorizationService.hasSensitivePermission(managerId, farmAId, SensitivePermission.INVENTORY_ADJUST));
    }
}
