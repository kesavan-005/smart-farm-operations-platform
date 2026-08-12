package com.smartfarm.features.farm.dto.context;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmContextResponse {
    private FarmProfile farmProfile;
    private FarmContextSummary summary;
    private List<FieldContext> fields;
    private List<CropStateContext> cropStates;
    private List<ActivityContext> recentActivities;
    private FinanceSummary financeSummary;
    private InventorySummary inventorySummary;
    private List<AttentionItem> attentionItems;
}
