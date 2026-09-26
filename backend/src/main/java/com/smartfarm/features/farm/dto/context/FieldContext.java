package com.smartfarm.features.farm.dto.context;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldContext {
    private UUID id;
    private String name;
    private BigDecimal area;
    private String areaUnit;
    private String status;
    private String activeCropName;
    private UUID activeCropId;
}
