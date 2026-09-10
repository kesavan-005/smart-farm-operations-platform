package com.smartfarm.features.advisory.dto;

import com.smartfarm.features.farm.dto.context.FarmContextResponse;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Phase 5A: Context DTO containing all authorized backend-retrieved data needed to construct the prompt.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdvisoryContext {
    private String question;
    private FarmContextResponse farmContext;
    private List<KnowledgeRetrievalResult> retrievedKnowledge;
}
