package com.smartfarm.features.farm.dto;

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
public class FarmResponse {
    private UUID id;
    private UUID ownerUserId;
    private String farmCode;
    private String name;
    private String nameTa;
    private String description;
    private String descriptionTa;
    private BigDecimal totalArea;
    private String areaUnit;
    private String address;
    private String village;
    private String taluk;
    private String district;
    private String state;
    private String pincode;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String soilType;
    private BigDecimal soilPh;
    private BigDecimal soilOrganicCarbon;
    private String irrigationType;
    private String waterSource;
    private String waterAvailability;
    private String drainageType;
    private BigDecimal averageRainfall;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
