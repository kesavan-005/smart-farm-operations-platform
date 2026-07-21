package com.smartfarm.features.inventory.dto;

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
public class InventoryItemRequest {
    @NotBlank(message = "Item name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String nameTa;

    @Size(max = 100)
    private String sku;

    @Size(max = 100)
    private String barcode;

    private UUID categoryId;

    @Size(max = 100)
    private String subcategory;

    private String description;

    @NotNull(message = "Quantity is required")
    private BigDecimal currentQuantity;

    @NotBlank(message = "Unit is required")
    @Size(max = 20)
    private String unit;

    @NotNull(message = "Minimum stock threshold is required")
    private BigDecimal minimumStock;

    private BigDecimal maximumStock;

    @NotNull(message = "Cost per unit is required")
    private BigDecimal cost;

    private BigDecimal sellingPrice;

    @Size(max = 100)
    private String supplier;

    @Size(max = 100)
    private String storageLocation;

    private UUID warehouseId;

    private LocalDate expiryDate;

    @Size(max = 50)
    private String batchNumber;

    @Size(max = 255)
    private String imageUrl;

    private String notes;

    @Builder.Default
    private String status = "active";
}
