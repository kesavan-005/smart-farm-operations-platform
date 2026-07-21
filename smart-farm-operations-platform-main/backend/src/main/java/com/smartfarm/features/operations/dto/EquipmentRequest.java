package com.smartfarm.features.operations.dto;

import com.smartfarm.features.operations.domain.EquipmentStatus;
import com.smartfarm.features.operations.domain.EquipmentType;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Data;

@Data
public class EquipmentRequest {
    private UUID farmId;
    private String name;
    private EquipmentType type;
    private EquipmentStatus status;
    private OffsetDateTime lastMaintenanceDate;
}
