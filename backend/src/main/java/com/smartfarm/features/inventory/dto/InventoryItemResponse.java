package com.smartfarm.features.inventory.dto;

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
public class InventoryItemResponse {
    private UUID id;
    private UUID farmId;
    private String name;
    private String nameTa;
    private String sku;
    private String barcode;
    private InventoryCategoryResponse category;
    private String subcategory;
    private String description;
    private BigDecimal currentQuantity;
    private String unit;
    private BigDecimal minimumStock;
    private BigDecimal maximumStock;
    private BigDecimal cost;
    private BigDecimal sellingPrice;
    private String supplier;
    private String storageLocation;
    private WarehouseResponse warehouse;
    private LocalDate expiryDate;
    private String batchNumber;
    private String imageUrl;
    private String notes;
    private String status;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
