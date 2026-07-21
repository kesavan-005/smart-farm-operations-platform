package com.smartfarm.features.farm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmRequest {
    @NotBlank(message = "Farm name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String nameTa;

    private String description;
    private String descriptionTa;
    
    private BigDecimal totalArea;
    
    @Size(max = 10)
    private String areaUnit;
    
    private String address;

    @Size(max = 100)
    private String village;

    @Size(max = 100)
    private String taluk;

    @Size(max = 100)
    private String district;

    @NotBlank(message = "State is required")
    @Size(max = 100)
    private String state;

    @Size(max = 20)
    private String pincode;

    private BigDecimal latitude;
    private BigDecimal longitude;

    @Size(max = 50)
    private String soilType;

    private BigDecimal soilPh;
    private BigDecimal soilOrganicCarbon;

    @Size(max = 50)
    private String irrigationType;

    @Size(max = 50)
    private String waterSource;

    @Size(max = 100)
    private String waterAvailability;

    @Size(max = 100)
    private String drainageType;

    private BigDecimal averageRainfall;

    @Builder.Default
    private String status = "active";
}
