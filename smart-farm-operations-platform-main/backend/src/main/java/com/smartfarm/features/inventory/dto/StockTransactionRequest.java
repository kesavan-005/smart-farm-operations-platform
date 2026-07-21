package com.smartfarm.features.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransactionRequest {
    @NotBlank(message = "Transaction type is required")
    @Size(max = 30)
    private String transactionType; // PURCHASE, SALE, USAGE, TRANSFER, ADJUSTMENT, RETURN, WASTE, HARVEST_STORAGE

    @NotNull(message = "Quantity is required")
    private BigDecimal quantity;

    @NotBlank(message = "Unit is required")
    @Size(max = 20)
    private String unit;

    @Size(max = 100)
    private String reference;

    private String notes;
}
