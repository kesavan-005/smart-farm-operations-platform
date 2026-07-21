package com.smartfarm.features.task.dto;

import com.smartfarm.features.task.domain.TaskPriority;
import com.smartfarm.features.task.domain.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class TaskRequest {
    @NotNull(message = "Activity ID is required")
    private UUID activityId;

    @NotNull(message = "Farm ID is required")
    private UUID farmId;

    @NotNull(message = "Field ID is required")
    private UUID fieldId;

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title cannot exceed 255 characters")
    private String title;

    private String description;

    private UUID assignedTo;

    private TaskPriority priority;

    private TaskStatus status;

    @NotNull(message = "Due date is required")
    private OffsetDateTime dueDate;

    private OffsetDateTime completedDate;

    private BigDecimal estimatedHours;

    private BigDecimal actualHours;

    private String remarks;

    private UUID assignedEquipmentId;
    private UUID inventoryItemId;
    private BigDecimal inventoryQuantityUsed;
    private BigDecimal actualCost;
    private String gpsLocation;
}
