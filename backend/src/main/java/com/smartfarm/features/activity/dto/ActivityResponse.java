package com.smartfarm.features.activity.dto;

import com.smartfarm.features.activity.domain.ActivityPriority;
import com.smartfarm.features.activity.domain.ActivityStatus;
import com.smartfarm.features.activity.domain.ActivityType;
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
public class ActivityResponse {
    private UUID id;
    private String title;
    private String description;
    private ActivityType activityType;
    private ActivityStatus status;
    private ActivityPriority priority;

    private UUID farmId;
    private String farmCode;
    private String farmName;

    private UUID fieldId;
    private String fieldCode;
    private String fieldName;

    private UUID cropId;
    private String cropName;

    private UUID performedBy;
    private String performedByName;
    private String performedByPhone;

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
    private String supervisorName;
    private String requiredEquipment;
    private String requiredInventory;
    private Integer progress;

    private UUID createdBy;
    private String createdByName;
    private UUID updatedBy;
    private String updatedByName;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
