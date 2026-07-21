package com.smartfarm.features.finance.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Data;

@Data
public class FinancialTransactionResponse {
    private UUID id;
    private UUID farmId;
    private String transactionType;
    private String category;
    private BigDecimal amount;
    private String description;
    private UUID referenceId;
    private String referenceType;
    private String paymentMethod;
    private String status;
    private OffsetDateTime transactionDate;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
