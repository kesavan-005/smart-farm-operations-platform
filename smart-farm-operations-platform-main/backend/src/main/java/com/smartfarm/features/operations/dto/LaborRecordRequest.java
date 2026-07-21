package com.smartfarm.features.operations.dto;

import com.smartfarm.features.operations.domain.LaborStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Data;

@Data
public class LaborRecordRequest {
    private UUID farmId;
    private UUID workerId;
    private LocalDate recordDate;
    private LaborStatus status;
    private OffsetDateTime checkIn;
    private OffsetDateTime checkOut;
    private BigDecimal workingHours;
    private Integer productivityScore;
    private String remarks;
}
