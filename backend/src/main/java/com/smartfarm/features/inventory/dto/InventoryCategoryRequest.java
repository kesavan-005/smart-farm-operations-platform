package com.smartfarm.features.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryCategoryRequest {
    @NotBlank(message = "Category name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String nameTa;

    @Size(max = 50)
    private String icon;

    @Size(max = 50)
    private String color;

    private String description;

    private UUID parentCategoryId;
}
