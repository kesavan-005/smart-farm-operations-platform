package com.smartfarm.features.activity.dto;

import com.smartfarm.features.activity.domain.ActivityPriority;
import com.smartfarm.features.activity.domain.ActivityStatus;
import com.smartfarm.features.activity.domain.ActivityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class ActivityRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 255)
    private String title;

    private String description;

    @NotNull(message = "Activity type is required")
    private ActivityType activityType;

    private ActivityStatus status;

    private ActivityPriority priority;

    @NotNull(message = "Farm ID is required")
    private UUID farmId;

    @NotNull(message = "Field ID is required")
    private UUID fieldId;

    private UUID cropId;

    private UUID performedBy;

    @NotNull(message = "Scheduled date is required")
    private OffsetDateTime scheduledDate;

    private OffsetDateTime completedDate;

    private Integer estimatedDuration;

    private Integer actualDuration;

    private String notes;

    private String attachments;

    private String season;

    private OffsetDateTime startDate;

    private OffsetDateTime endDate;

    private java.math.BigDecimal estimatedCost;

    private UUID supervisorId;

    private String requiredEquipment;

    private String requiredInventory;
}
