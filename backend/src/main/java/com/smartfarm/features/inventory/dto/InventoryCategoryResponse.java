package com.smartfarm.features.inventory.dto;

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
public class InventoryCategoryResponse {
    private UUID id;
    private UUID farmId;
    private String name;
    private String nameTa;
    private String icon;
    private String color;
    private String description;
    private UUID parentCategoryId;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
