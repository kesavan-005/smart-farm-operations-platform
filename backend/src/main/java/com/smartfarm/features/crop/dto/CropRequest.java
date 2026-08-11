package com.smartfarm.features.crop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CropRequest {
    @NotNull(message = "Field ID is required")
    private UUID fieldId;

    @NotBlank(message = "Crop name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String nameTa;

    @Size(max = 100)
    private String variety;

    @Size(max = 50)
    private String season;

    private LocalDate sowingDate;
    private LocalDate expectedHarvestDate;

    @Size(max = 50)
    private String plantingMethod;

    private BigDecimal expectedYield;

    @Size(max = 10)
    private String yieldUnit;

    private String notes;
    private String notesTa;

    @Builder.Default
    private String status = "active";
}
