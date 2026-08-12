package com.smartfarm.features.inventory.domain;

import com.smartfarm.features.farm.domain.Farm;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "inventory_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE inventory_items SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@SQLRestriction("deleted = false")
public class InventoryItem {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "name_ta", length = 100)
    private String nameTa;

    @Column(unique = true, length = 100)
    private String sku;

    @Column(length = 100)
    private String barcode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private InventoryCategory category;

    @Column(length = 100)
    private String subcategory;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "current_quantity", nullable = false)
    @Builder.Default
    private BigDecimal currentQuantity = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(name = "minimum_stock", nullable = false)
    @Builder.Default
    private BigDecimal minimumStock = BigDecimal.ZERO;

    @Column(name = "maximum_stock")
    private BigDecimal maximumStock;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal cost = BigDecimal.ZERO;

    @Column(name = "selling_price")
    private BigDecimal sellingPrice;

    @Column(length = 100)
    private String supplier;

    @Column(name = "storage_location", length = 100)
    private String storageLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "batch_number", length = 50)
    private String batchNumber;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "active";

    @Builder.Default
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
