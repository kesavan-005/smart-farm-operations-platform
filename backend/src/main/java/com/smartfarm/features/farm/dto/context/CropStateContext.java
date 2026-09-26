package com.smartfarm.features.farm.dto.context;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CropStateContext {
    private UUID id;
    private String name;
    private String variety;
    private LocalDate sowingDate;
    private LocalDate expectedHarvestDate;
    private String currentLifecycleStage;
    private boolean isCalculatedStage;
    private String status;
    private UUID fieldId;
}
