package com.smartfarm.features.inventory.dto;

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
public class StockTransactionResponse {
    private UUID id;
    private UUID inventoryItemId;
    private String transactionType;
    private BigDecimal quantity;
    private String unit;
    private UUID userId;
    private String userName;
    private String reference;
    private String notes;
    private OffsetDateTime createdAt;
}
