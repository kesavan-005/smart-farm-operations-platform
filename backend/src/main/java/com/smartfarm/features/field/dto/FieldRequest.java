package com.smartfarm.features.field.dto;

import com.smartfarm.common.dto.GeoJsonPolygon;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldRequest {
    @NotNull(message = "Farm ID is required")
    private UUID farmId;

    @NotBlank(message = "Field name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String nameTa;

    private BigDecimal area;

    @Size(max = 10)
    private String areaUnit;

    @Valid
    private GeoJsonPolygon boundary;

    @Size(max = 50)
    private String soilType;

    private BigDecimal soilPh;
    private BigDecimal soilOrganicCarbon;

    @Size(max = 50)
    private String irrigationType;

    @Size(max = 100)
    private String waterAvailability;

    @Size(max = 100)
    private String drainageType;

    private BigDecimal averageRainfall;
    private BigDecimal elevation;

    private String notes;
    private String notesTa;

    @Builder.Default
    private String status = "active";
}
