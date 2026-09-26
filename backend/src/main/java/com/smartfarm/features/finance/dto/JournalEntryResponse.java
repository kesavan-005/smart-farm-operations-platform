package com.smartfarm.features.finance.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Data;

@Data
public class JournalEntryResponse {
    private UUID id;
    private UUID financialTransactionId;
    private String accountName;
    private String entryType;
    private BigDecimal amount;
    private String notes;
    private OffsetDateTime createdAt;
}
