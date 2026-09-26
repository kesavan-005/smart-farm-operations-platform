package com.smartfarm.features.farm.dto.context;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventorySummary {
    private int totalUniqueItems;
    private int lowStockCount;
}
