package com.smartfarm.features.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Data;

@Data
public class FinancialTransactionRequest {
    private UUID id; // Client-side generated ID for offline support

    @NotBlank
    private String transactionType; // REVENUE, EXPENSE

    @NotBlank
    private String category; // SEED_PURCHASE, FERTILIZER_PURCHASE, etc.

    @NotNull
    @Positive
    private BigDecimal amount;

    private String description;

    private UUID referenceId;
    private String referenceType;

    private String paymentMethod;
    private String status;

    private OffsetDateTime transactionDate;
}
