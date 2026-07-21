package com.smartfarm.features.operations.dto;

import com.smartfarm.features.operations.domain.WorkOrderStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Data;

@Data
public class WorkOrderResponse {
    private UUID id;
    private UUID farmId;
    private String farmName;
    private String title;
    private String description;
    private String assignedTeam;
    private WorkOrderStatus status;
    private BigDecimal estimatedCost;
    private BigDecimal actualCost;
    private OffsetDateTime startDate;
    private OffsetDateTime completionDate;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
