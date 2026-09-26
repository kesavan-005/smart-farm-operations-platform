package com.smartfarm.features.farm.service;

import com.smartfarm.common.dto.GeoJsonPolygon;
import com.smartfarm.common.util.GeometryUtils;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.dto.GeofenceRequest;
import com.smartfarm.features.farm.dto.GeofenceResponse;
import com.smartfarm.features.farm.repository.FarmRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GeofenceServiceTest {

    @Mock
    private FarmRepository farmRepository;

    @InjectMocks
    private GeofenceService geofenceService;

    private GeoJsonPolygon validBoundary;

    @BeforeEach
    void setUp() {
        validBoundary = GeoJsonPolygon.builder()
                .type("Polygon")
                .coordinates(List.of(List.of(
                        List.of(78.11, 9.92),
                        List.of(78.12, 9.92),
                        List.of(78.12, 9.93),
                        List.of(78.11, 9.93),
                        List.of(78.11, 9.92)
                )))
                .build();
    }

    @Test
    void testCheckGeofenceForFarm_Inside() {
        UUID farmId = UUID.randomUUID();
        Farm farm = Farm.builder()
                .id(farmId)
                .name("Test Farm")
                .boundary(GeometryUtils.toJtsPolygon(validBoundary))
                .build();

        when(farmRepository.findById(farmId)).thenReturn(Optional.of(farm));

        GeofenceResponse response = geofenceService.checkGeofenceForFarm(farmId, BigDecimal.valueOf(9.925), BigDecimal.valueOf(78.115));

        assertTrue(response.isInside());
        assertEquals(farmId, response.getFarmId());
    }

    @Test
    void testCheckGeofenceForFarm_Outside() {
        UUID farmId = UUID.randomUUID();
        Farm farm = Farm.builder()
                .id(farmId)
                .name("Test Farm")
                .boundary(GeometryUtils.toJtsPolygon(validBoundary))
                .build();

        when(farmRepository.findById(farmId)).thenReturn(Optional.of(farm));

        GeofenceResponse response = geofenceService.checkGeofenceForFarm(farmId, BigDecimal.valueOf(10.5), BigDecimal.valueOf(79.0));

        assertFalse(response.isInside());
    }

    @Test
    void testCheckGeofenceForBoundary_Inside() {
        GeofenceRequest request = GeofenceRequest.builder()
                .latitude(BigDecimal.valueOf(9.925))
                .longitude(BigDecimal.valueOf(78.115))
                .boundary(validBoundary)
                .build();

        GeofenceResponse response = geofenceService.checkGeofenceForBoundary(request);

        assertTrue(response.isInside());
    }

    @Test
    void testValidateBoundary_Valid() {
        assertDoesNotThrow(() -> geofenceService.validateBoundary(validBoundary));
    }

    @Test
    void testValidateBoundary_InsufficientPoints() {
        GeoJsonPolygon invalid = GeoJsonPolygon.builder()
                .type("Polygon")
                .coordinates(List.of(List.of(
                        List.of(78.11, 9.92),
                        List.of(78.12, 9.92)
                )))
                .build();

        assertThrows(IllegalArgumentException.class, () -> geofenceService.validateBoundary(invalid));
    }
}
