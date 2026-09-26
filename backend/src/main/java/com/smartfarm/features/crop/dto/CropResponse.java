package com.smartfarm.features.crop.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
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
public class CropResponse {
    private UUID id;
    private UUID fieldId;
    private String name;
    private String nameTa;
    private String variety;
    private String season;
    private LocalDate sowingDate;
    private LocalDate expectedHarvestDate;
    private String plantingMethod;
    private BigDecimal expectedYield;
    private String yieldUnit;
    private String notes;
    private String notesTa;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
