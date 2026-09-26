package com.smartfarm.features.farm.service;

import com.smartfarm.common.dto.GeoJsonPolygon;
import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.common.util.GeometryUtils;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.dto.GeofenceRequest;
import com.smartfarm.features.farm.dto.GeofenceResponse;
import com.smartfarm.features.farm.repository.FarmRepository;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Polygon;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeofenceService {

    private final FarmRepository farmRepository;

    /**
     * Check if coordinates fall inside the boundary of a persisted Farm entity.
     */
    @Transactional(readOnly = true)
    public GeofenceResponse checkGeofenceForFarm(UUID farmId, BigDecimal latitude, BigDecimal longitude) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found with id: " + farmId));

        if (farm.getBoundary() == null) {
            return GeofenceResponse.builder()
                    .inside(false)
                    .farmId(farmId)
                    .message("Farm has no boundary defined")
                    .build();
        }

        boolean inside = GeometryUtils.isPointInside(farm.getBoundary(), latitude.doubleValue(), longitude.doubleValue());
        
        return GeofenceResponse.builder()
                .inside(inside)
                .farmId(farmId)
                .message(inside ? "Coordinate is INSIDE farm boundary" : "Coordinate is OUTSIDE farm boundary")
                .build();
    }

    /**
     * Check if coordinates fall inside a supplied GeoJSON Polygon boundary.
     */
    public GeofenceResponse checkGeofenceForBoundary(GeofenceRequest request) {
        if (request.getBoundary() == null) {
            return GeofenceResponse.builder()
                    .inside(false)
                    .message("No boundary provided in request")
                    .build();
        }

        Polygon polygon = GeometryUtils.toJtsPolygon(request.getBoundary());
        if (polygon == null) {
            return GeofenceResponse.builder()
                    .inside(false)
                    .message("Invalid boundary polygon structure")
                    .build();
        }

        boolean inside = GeometryUtils.isPointInside(polygon, request.getLatitude().doubleValue(), request.getLongitude().doubleValue());

        return GeofenceResponse.builder()
                .inside(inside)
                .message(inside ? "Coordinate is INSIDE farm boundary" : "Coordinate is OUTSIDE farm boundary")
                .build();
    }

    /**
     * Validate GeoJSON polygon coordinates on backend.
     */
    public void validateBoundary(GeoJsonPolygon boundary) {
        if (boundary == null) {
            throw new IllegalArgumentException("Please draw your farm boundary on the map before saving.");
        }

        if (!"Polygon".equalsIgnoreCase(boundary.getType())) {
            throw new IllegalArgumentException("Boundary geometry must be a Polygon.");
        }

        if (boundary.getCoordinates() == null || boundary.getCoordinates().isEmpty() || boundary.getCoordinates().get(0) == null) {
            throw new IllegalArgumentException("Boundary coordinates cannot be empty.");
        }

        var ring = boundary.getCoordinates().get(0);
        if (ring.size() < 4) {
            throw new IllegalArgumentException("Farm boundary polygon must contain at least 3 unique vertices.");
        }

        for (var pt : ring) {
            if (pt == null || pt.size() < 2) {
                throw new IllegalArgumentException("Boundary contains invalid coordinate points.");
            }
            double lng = pt.get(0);
            double lat = pt.get(1);
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                throw new IllegalArgumentException("Coordinates outside valid latitude [-90,90] or longitude [-180,180] range.");
            }
        }
    }
}
