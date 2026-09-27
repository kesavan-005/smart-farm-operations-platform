package com.smartfarm.features.knowledge.evaluation;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("prod")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://localhost:5432/smartfarm",
    "spring.datasource.username=smartfarm",
    "spring.datasource.password=smartfarm_dev",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.flyway.enabled=true",
    "spring.ai.vectorstore.pgvector.table-name=vector_store",
    "spring.ai.vectorstore.pgvector.dimensions=384",
    "spring.ai.vectorstore.pgvector.distance-type=COSINE_DISTANCE",
    "spring.ai.vectorstore.pgvector.index-type=HNSW",
    "smartfarm.knowledge.retrieval.max-distance=0.50"
})
@DisplayName("Phase 2.8.1-2.8.3 - Retrieval Quality Evaluation Integration Test")
class RetrievalEvaluationIntegrationTest {

    @Autowired
    private RetrievalEvaluationService evaluationService;

    @Test
    @DisplayName("Evaluate standard agricultural dataset against production knowledge base")
    void evaluateStandardDataset() {
        RetrievalEvaluationReport report = evaluationService.evaluateStandardDataset();

        assertThat(report).isNotNull();
        assertThat(report.getTotalCases()).isEqualTo(11);

        // Verify positive cases achieve strong retrieval
        assertThat(report.getTop5Hits()).isGreaterThanOrEqualTo(8);
        assertThat(report.getTop5HitRate()).isGreaterThanOrEqualTo(0.85);

        // Verify out-of-domain negative queries return zero results (100% no-result rate for negative queries)
        assertThat(report.getNoResultCases()).isEqualTo(2);

        // Verify average distance is within reasonable bounds for cosine distance
        assertThat(report.getAverageDistance()).isLessThan(0.48);

        // Log results for report generation
        System.out.printf("--- PHASE 2.8 RETRIEVAL EVALUATION REPORT ---%n");
        System.out.printf("Total Cases: %d | Passed: %d | Failed: %d%n",
                report.getTotalCases(), report.getPassedCases(), report.getFailedCases());
        System.out.printf("Top-1 Hits: %d (%.1f%%) | Top-3 Hits: %d (%.1f%%) | Top-5 Hits: %d (%.1f%%)%n",
                report.getTop1Hits(), report.getTop1HitRate() * 100,
                report.getTop3Hits(), report.getTop3HitRate() * 100,
                report.getTop5Hits(), report.getTop5HitRate() * 100);
        System.out.printf("No-Result Cases: %d (%.1f%%)%n", report.getNoResultCases(), report.getNoResultRate() * 100);
        System.out.printf("Average Cosine Distance: %.4f | Average Latency: %.1f ms%n",
                report.getAverageDistance(), report.getAverageLatencyMs());
        System.out.printf("--------------------------------------------%n");
    }

    @Test
    @DisplayName("Evaluate English blackgram cultivation retrieval precision")
    void evaluateBlackgramCultivation() {
        RetrievalEvaluationCase singleCase = RetrievalEvaluationDataset.getStandardEvaluationCases().get(0);
        RetrievalEvaluationReport report = evaluationService.evaluate(List.of(singleCase));

        assertThat(report.getPassedCases()).isEqualTo(1);
        RetrievalEvaluationResult result = report.getCaseResults().get(0);
        assertThat(result.isPassed()).isTrue();
        assertThat(result.getTopDocumentTitle()).isEqualTo(RetrievalEvaluationDataset.DOC_TNAU_BLACKGRAM);
        assertThat(result.getTopDistance()).isLessThan(0.45);
    }

    @Test
    @DisplayName("Evaluate Tamil regional language retrieval precision")
    void evaluateTamilRegionalRetrieval() {
        // Case 8 is the Tamil Kharif query
        RetrievalEvaluationCase tamilCase = RetrievalEvaluationDataset.getStandardEvaluationCases().get(7);
        RetrievalEvaluationReport report = evaluationService.evaluate(List.of(tamilCase));

        assertThat(report.getPassedCases()).isEqualTo(1);
        RetrievalEvaluationResult result = report.getCaseResults().get(0);
        assertThat(result.isPassed()).isTrue();
        assertThat(result.getTopDocumentTitle()).isEqualTo(RetrievalEvaluationDataset.DOC_ICAR_KHARIF_MULTI);
    }

    @Test
    @DisplayName("Evaluate negative query rejection (out of domain query returns 0 chunks)")
    void evaluateNegativeQueryRejection() {
        // Case 10 is the quantum physics negative control
        RetrievalEvaluationCase negativeCase = RetrievalEvaluationDataset.getStandardEvaluationCases().get(9);
        RetrievalEvaluationReport report = evaluationService.evaluate(List.of(negativeCase));

        assertThat(report.getPassedCases()).isEqualTo(1);
        RetrievalEvaluationResult result = report.getCaseResults().get(0);
        assertThat(result.isNoResult()).isTrue();
        assertThat(result.getRetrievedCount()).isEqualTo(0);
    }
}
