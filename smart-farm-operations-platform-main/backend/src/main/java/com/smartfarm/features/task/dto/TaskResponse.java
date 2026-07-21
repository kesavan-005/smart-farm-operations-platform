package com.smartfarm.features.task.dto;

import com.smartfarm.features.task.domain.TaskPriority;
import com.smartfarm.features.task.domain.TaskStatus;
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
public class TaskResponse {
    private UUID id;
    private UUID activityId;
    private String activityTitle;
    private UUID farmId;
    private String farmName;
    private UUID fieldId;
    private String fieldName;
    private String title;
    private String description;
    private UUID assignedTo;
    private String assignedToName;
    private String assignedToPhone;
    private UUID assignedBy;
    private String assignedByName;
    private TaskPriority priority;
    private TaskStatus status;
    private OffsetDateTime dueDate;
    private OffsetDateTime completedDate;
    private BigDecimal estimatedHours;
    private BigDecimal actualHours;
    private String remarks;
    private UUID createdBy;
    private String createdByName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    private UUID assignedEquipmentId;
    private String assignedEquipmentName;
    private UUID inventoryItemId;
    private BigDecimal inventoryQuantityUsed;
    private BigDecimal actualCost;
    private UUID updatedBy;
    private String updatedByName;
    private String gpsLocation;
}
