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
public class FarmProfile {
    private String name;
    private String location; // Village, Taluk, District, State
    private BigDecimal totalArea;
    private String areaUnit;
    private String soilType;
    private String irrigationSource;
}
