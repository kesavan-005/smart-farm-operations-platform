package com.smartfarm.features.knowledge.evaluation;

import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Phase 2.8: Detailed outcome of a single retrieval evaluation query execution.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetrievalEvaluationResult {

    private String caseId;
    private String question;
    private String category;
    private boolean passed;
    private boolean top1Hit;
    private boolean top3Hit;
    private boolean top5Hit;
    private boolean noResult;
    private int retrievedCount;
    private String topDocumentTitle;
    private Double topDistance;
    private Double averageDistance;
    private long latencyMs;
    private String failureReason;
    private List<KnowledgeRetrievalResult> retrievedChunks;
}
