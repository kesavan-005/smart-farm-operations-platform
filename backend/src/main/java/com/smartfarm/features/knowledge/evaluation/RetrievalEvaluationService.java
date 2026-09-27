package com.smartfarm.features.knowledge.evaluation;

import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import com.smartfarm.features.knowledge.service.KnowledgeRetrievalService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Phase 2.8.1: Retrieval quality evaluation service.
 * Systematically evaluates semantic search precision, hit rates (Top-1, Top-3, Top-5),
 * distance scores, and retrieval latency against controlled agricultural evaluation cases.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RetrievalEvaluationService {

    private final KnowledgeRetrievalService retrievalService;

    /**
     * Executes the standard baseline evaluation dataset.
     */
    public RetrievalEvaluationReport evaluateStandardDataset() {
        return evaluate(RetrievalEvaluationDataset.getStandardEvaluationCases());
    }

    /**
     * Executes a list of retrieval evaluation cases and generates an aggregated quality report.
     *
     * @param cases The list of evaluation cases to test.
     * @return Aggregated RetrievalEvaluationReport.
     */
    public RetrievalEvaluationReport evaluate(List<RetrievalEvaluationCase> cases) {
        log.info("Starting RAG retrieval quality evaluation across {} cases...", cases.size());

        List<RetrievalEvaluationResult> results = new ArrayList<>();
        int passedCount = 0;
        int top1Hits = 0;
        int top3Hits = 0;
        int top5Hits = 0;
        int noResultCount = 0;
        double sumDistance = 0.0;
        int distanceSamples = 0;
        long sumLatencyMs = 0;

        for (RetrievalEvaluationCase testCase : cases) {
            long startTime = System.currentTimeMillis();

            KnowledgeRetrievalRequest request = KnowledgeRetrievalRequest.builder()
                    .query(testCase.getQuestion())
                    .topK(5)
                    .build();

            List<KnowledgeRetrievalResult> retrievedChunks;
            try {
                retrievedChunks = retrievalService.search(request);
            } catch (Exception e) {
                log.error("Retrieval failed for case {}: {}", testCase.getId(), e.getMessage());
                retrievedChunks = List.of();
            }

            long latencyMs = System.currentTimeMillis() - startTime;
            sumLatencyMs += latencyMs;

            boolean top1Hit = false;
            boolean top3Hit = false;
            boolean top5Hit = false;
            boolean noResult = retrievedChunks.isEmpty();
            String topDocTitle = noResult ? null : retrievedChunks.get(0).getTitle();
            Double topDistance = (noResult || retrievedChunks.get(0).getScore() == null)
                    ? null
                    : 1.0 - retrievedChunks.get(0).getScore();

            double caseAvgDistance = 0.0;
            if (!noResult) {
                double caseSumDist = 0.0;
                int distCount = 0;
                for (KnowledgeRetrievalResult chunk : retrievedChunks) {
                    if (chunk.getScore() != null) {
                        double dist = 1.0 - chunk.getScore();
                        caseSumDist += dist;
                        distCount++;
                    }
                }
                if (distCount > 0) {
                    caseAvgDistance = caseSumDist / distCount;
                    sumDistance += caseAvgDistance;
                    distanceSamples++;
                }
            }

            boolean passed;
            String failureReason = null;

            if (testCase.isExpectNoResult()) {
                passed = noResult;
                if (!passed) {
                    failureReason = "Expected zero results for negative query, but received " + retrievedChunks.size() + " chunks";
                } else {
                    noResultCount++;
                }
            } else {
                for (int i = 0; i < retrievedChunks.size(); i++) {
                    String title = retrievedChunks.get(i).getTitle();
                    if (testCase.matchesDocument(title)) {
                        if (i == 0) top1Hit = true;
                        if (i < 3) top3Hit = true;
                        if (i < 5) top5Hit = true;
                    }
                }

                if (top1Hit) top1Hits++;
                if (top3Hit) top3Hits++;
                if (top5Hit) top5Hits++;

                // A case passes if the expected document is retrieved within top-5
                passed = top5Hit;
                if (!passed) {
                    failureReason = "Expected document '" + testCase.getExpectedDocumentTitle() + "' not found in top "
                            + retrievedChunks.size() + " results (top doc: " + topDocTitle + ")";
                }
            }

            if (passed) {
                passedCount++;
            }

            results.add(RetrievalEvaluationResult.builder()
                    .caseId(testCase.getId())
                    .question(testCase.getQuestion())
                    .category(testCase.getCategory())
                    .passed(passed)
                    .top1Hit(top1Hit)
                    .top3Hit(top3Hit)
                    .top5Hit(top5Hit)
                    .noResult(noResult)
                    .retrievedCount(retrievedChunks.size())
                    .topDocumentTitle(topDocTitle)
                    .topDistance(topDistance)
                    .averageDistance(caseAvgDistance > 0 ? caseAvgDistance : null)
                    .latencyMs(latencyMs)
                    .failureReason(failureReason)
                    .retrievedChunks(retrievedChunks)
                    .build());
        }

        int totalCases = cases.size();
        int positiveCases = (int) cases.stream().filter(c -> !c.isExpectNoResult()).count();
        double top1Rate = positiveCases > 0 ? (double) top1Hits / positiveCases : 0.0;
        double top3Rate = positiveCases > 0 ? (double) top3Hits / positiveCases : 0.0;
        double top5Rate = positiveCases > 0 ? (double) top5Hits / positiveCases : 0.0;
        double noResultRate = totalCases > 0 ? (double) noResultCount / totalCases : 0.0;
        double avgDistance = distanceSamples > 0 ? sumDistance / distanceSamples : 0.0;
        double avgLatency = totalCases > 0 ? (double) sumLatencyMs / totalCases : 0.0;

        log.info("Evaluation complete: {}/{} passed. Top-1={}/{} ({:.1f}%), Top-3={}/{} ({:.1f}%), Top-5={}/{} ({:.1f}%), AvgLatency={:.1f}ms",
                passedCount, totalCases, top1Hits, positiveCases, top1Rate * 100,
                top3Hits, positiveCases, top3Rate * 100,
                top5Hits, positiveCases, top5Rate * 100, avgLatency);

        return RetrievalEvaluationReport.builder()
                .totalCases(totalCases)
                .passedCases(passedCount)
                .failedCases(totalCases - passedCount)
                .top1Hits(top1Hits)
                .top3Hits(top3Hits)
                .top5Hits(top5Hits)
                .noResultCases(noResultCount)
                .top1HitRate(top1Rate)
                .top3HitRate(top3Rate)
                .top5HitRate(top5Rate)
                .noResultRate(noResultRate)
                .averageDistance(avgDistance)
                .averageLatencyMs(avgLatency)
                .caseResults(results)
                .build();
    }
}
