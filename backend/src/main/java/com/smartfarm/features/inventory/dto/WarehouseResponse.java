package com.smartfarm.features.inventory.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseResponse {
    private UUID id;
    private UUID farmId;
    private String name;
    private String nameTa;
    private BigDecimal capacity;
    private String location;
    private String manager;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
