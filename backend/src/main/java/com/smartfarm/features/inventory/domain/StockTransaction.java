package com.smartfarm.features.inventory.domain;

import com.smartfarm.features.auth.domain.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "stock_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransaction {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(name = "transaction_type", nullable = false, length = 30)
    private String transactionType; // PURCHASE, SALE, USAGE, TRANSFER, ADJUSTMENT, RETURN, WASTE, HARVEST_STORAGE

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(nullable = false, length = 20)
    private String unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 100)
    private String reference;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
