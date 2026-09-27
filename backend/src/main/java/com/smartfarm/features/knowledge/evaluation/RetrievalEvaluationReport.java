package com.smartfarm.features.knowledge.evaluation;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Phase 2.8: Aggregated statistical quality report across an evaluation dataset.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetrievalEvaluationReport {

    private int totalCases;
    private int passedCases;
    private int failedCases;

    private int top1Hits;
    private int top3Hits;
    private int top5Hits;
    private int noResultCases;

    private double top1HitRate;
    private double top3HitRate;
    private double top5HitRate;
    private double noResultRate;

    private double averageDistance;
    private double averageLatencyMs;

    @Builder.Default
    private List<RetrievalEvaluationResult> caseResults = new ArrayList<>();
}
