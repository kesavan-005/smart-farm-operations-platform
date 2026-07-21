package com.smartfarm.features.operations.dto;

import com.smartfarm.features.operations.domain.EquipmentStatus;
import com.smartfarm.features.operations.domain.EquipmentType;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Data;

@Data
public class EquipmentResponse {
    private UUID id;
    private UUID farmId;
    private String farmName;
    private String name;
    private EquipmentType type;
    private EquipmentStatus status;
    private OffsetDateTime lastMaintenanceDate;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
