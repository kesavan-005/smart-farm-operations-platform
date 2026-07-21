package com.smartfarm.features.operations.dto;

import com.smartfarm.features.operations.domain.ScheduleType;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Data;

@Data
public class FarmScheduleResponse {
    private UUID id;
    private UUID farmId;
    private String farmName;
    private String title;
    private String description;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private String recurrence;
    private ScheduleType type;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
