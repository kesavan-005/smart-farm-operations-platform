package com.smartfarm.features.advisory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Phase 5A: Response DTO containing the LLM answer and traceable sources.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdvisoryResponse {
    private String answer;
    private List<AdvisorySource> sources;
    private boolean weatherUsed;
}
