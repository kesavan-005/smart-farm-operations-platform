package com.smartfarm.features.field.dto;

import com.smartfarm.common.dto.GeoJsonPolygon;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldResponse {
    private UUID id;
    private UUID farmId;
    private String fieldCode;
    private String name;
    private String nameTa;
    private BigDecimal area;
    private String areaUnit;
    private GeoJsonPolygon boundary;
    private String soilType;
    private BigDecimal soilPh;
    private BigDecimal soilOrganicCarbon;
    private String irrigationType;
    private String waterAvailability;
    private String drainageType;
    private BigDecimal averageRainfall;
    private BigDecimal elevation;
    private String notes;
    private String notesTa;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
