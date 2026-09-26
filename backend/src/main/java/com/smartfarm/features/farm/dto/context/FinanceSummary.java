package com.smartfarm.features.farm.dto.context;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceSummary {
    private BigDecimal currentMonthExpenses;
    private String currency;
}
