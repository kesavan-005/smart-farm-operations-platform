package com.smartfarm.features.advisory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Phase 5A: Request DTO for agricultural advisory orchestration.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdvisoryRequest {

    /**
     * The ID of the farm. Required for retrieving FarmContext.
     */
    @NotNull(message = "farmId is required")
    private UUID farmId;

    /**
     * Optional ID of the field. If provided, the orchestration will ensure the field belongs to the farm.
     */
    private UUID fieldId;

    /**
     * The farmer's question. Must not be blank.
     */
    @NotBlank(message = "question must not be blank")
    private String question;
}
