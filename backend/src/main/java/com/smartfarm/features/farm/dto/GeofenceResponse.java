package com.smartfarm.features.farm.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeofenceResponse {
    private boolean inside;
    private UUID farmId;
    private Double distanceToCentroidMeters;
    private String message;
}
