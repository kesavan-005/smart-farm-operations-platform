package com.smartfarm.features.farm.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;


import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.dto.FarmRequest;
import com.smartfarm.features.farm.dto.FarmResponse;
import com.smartfarm.features.farm.mapper.FarmMapper;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.auth.security.FarmAuthorizationService;
import com.smartfarm.features.auth.repository.UserFarmRoleRepository;
import com.smartfarm.features.farm.service.GeofenceService;
import com.smartfarm.features.auth.domain.FarmModule;
import com.smartfarm.features.auth.domain.ModuleAccessLevel;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.access.AccessDeniedException;

class FarmServiceTest {

    @Mock
    private FarmRepository farmRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FarmMapper farmMapper;

    private FarmAuthorizationService farmAuthorizationService = new FarmAuthorizationService(null, null, null, null, null) {
        @Override
        public boolean hasFarmAccess(UUID userId, UUID farmId) { return true; }
        
        @Override
        public boolean isOwner(UUID userId, UUID farmId) { return true; }
        
        @Override
        public boolean hasModuleAccess(UUID userId, UUID farmId, FarmModule module, ModuleAccessLevel requiredLevel) { return true; }
    };

    private GeofenceService geofenceService = new GeofenceService(null) {
        @Override
        public void validateBoundary(com.smartfarm.common.dto.GeoJsonPolygon boundary) {
            // do nothing
        }
    };

    @Mock
    private UserFarmRoleRepository userFarmRoleRepository;

    private FarmService farmService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        farmService = new FarmService(farmRepository, userRepository, farmMapper, geofenceService, farmAuthorizationService, userFarmRoleRepository);
    }

    @Test
    void createFarm_Success() {
        UUID ownerId = UUID.randomUUID();
        User owner = User.builder().id(ownerId).name("Owner").build();
        FarmRequest request = FarmRequest.builder()
                .name("Test Farm")
                .state("TN")
                .latitude(java.math.BigDecimal.valueOf(11.0))
                .longitude(java.math.BigDecimal.valueOf(77.0))
                .build();
        Farm farm = Farm.builder()
                .name("Test Farm")
                .owner(owner)
                .latitude(java.math.BigDecimal.valueOf(11.0))
                .longitude(java.math.BigDecimal.valueOf(77.0))
                .build();
        FarmResponse response = FarmResponse.builder().name("Test Farm").build();

        when(userRepository.findById(ownerId)).thenReturn(Optional.of(owner));
        when(farmMapper.toEntity(request)).thenReturn(farm);
        when(farmRepository.existsByFarmCode(anyString())).thenReturn(false);
        when(farmRepository.save(any(Farm.class))).thenReturn(farm);
        when(farmMapper.toResponse(farm)).thenReturn(response);

        FarmResponse result = farmService.createFarm(request, ownerId);

        assertNotNull(result);
        verify(farmRepository).save(any(Farm.class));
    }

    @Test
    void getFarmById_Success() {
        UUID farmId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        User owner = User.builder().id(ownerId).build();
        Farm farm = Farm.builder().id(farmId).owner(owner).build();
        FarmResponse response = FarmResponse.builder().id(farmId).build();

        when(farmRepository.findById(farmId)).thenReturn(Optional.of(farm));
        when(farmMapper.toResponse(farm)).thenReturn(response);
        FarmResponse result = farmService.getFarmById(farmId, ownerId);

        assertNotNull(result);
        assertEquals(farmId, result.getId());
    }

    @Test
    void getFarmById_AccessDenied() {
        UUID farmId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        User owner = User.builder().id(otherUserId).build();
        Farm farm = Farm.builder().id(farmId).owner(owner).build();

        when(farmRepository.findById(farmId)).thenReturn(Optional.of(farm));
        farmAuthorizationService = new FarmAuthorizationService(null, null, null, null, null) {
            @Override
            public boolean hasFarmAccess(UUID uId, UUID fId) { return false; }
        };
        // Re-inject the new mock
        farmService = new FarmService(farmRepository, userRepository, farmMapper, geofenceService, farmAuthorizationService, userFarmRoleRepository);

        assertThrows(AccessDeniedException.class, () -> farmService.getFarmById(farmId, ownerId));
    }

    @Test
    void deleteFarm_Success() {
        UUID farmId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        User owner = User.builder().id(ownerId).build();
        Farm farm = Farm.builder().id(farmId).owner(owner).deleted(false).build();

        when(farmRepository.findById(farmId)).thenReturn(Optional.of(farm));
        farmService.deleteFarm(farmId, ownerId);

        assertTrue(farm.isDeleted());
        assertNotNull(farm.getDeletedAt());
        verify(farmRepository).save(farm);
    }
}
