package com.smartfarm.features.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class FinancialBudgetRequest {
    private UUID id;

    @NotBlank
    private String category;

    @NotNull
    @Positive
    private BigDecimal limitAmount;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;
}
