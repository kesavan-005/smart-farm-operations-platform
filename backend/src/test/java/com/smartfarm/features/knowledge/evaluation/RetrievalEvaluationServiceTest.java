package com.smartfarm.features.knowledge.evaluation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import com.smartfarm.features.knowledge.service.KnowledgeRetrievalService;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Phase 2.8.1 - Retrieval Evaluation Service Unit Tests")
class RetrievalEvaluationServiceTest {

    private KnowledgeRetrievalService retrievalService;
    private RetrievalEvaluationService evaluationService;

    @BeforeEach
    void setUp() {
        retrievalService = mock(KnowledgeRetrievalService.class);
        evaluationService = new RetrievalEvaluationService(retrievalService);
    }

    @Test
    @DisplayName("Evaluate positive case with Top-1 hit")
    void evaluateTop1Hit() {
        RetrievalEvaluationCase testCase = RetrievalEvaluationCase.builder()
                .id("TEST-01")
                .category("TEST")
                .question("Test question")
                .expectedDocumentTitle("Expected Guide")
                .expectNoResult(false)
                .build();

        KnowledgeRetrievalResult chunk1 = KnowledgeRetrievalResult.builder()
                .title("Expected Guide")
                .score(0.80)
                .build();

        when(retrievalService.search(any())).thenReturn(List.of(chunk1));

        RetrievalEvaluationReport report = evaluationService.evaluate(List.of(testCase));

        assertThat(report.getTotalCases()).isEqualTo(1);
        assertThat(report.getPassedCases()).isEqualTo(1);
        assertThat(report.getTop1Hits()).isEqualTo(1);
        assertThat(report.getTop1HitRate()).isEqualTo(1.0);
        assertThat(report.getTop3HitRate()).isEqualTo(1.0);
        assertThat(report.getTop5HitRate()).isEqualTo(1.0);
        assertThat(report.getAverageDistance()).isCloseTo(0.20, org.assertj.core.data.Offset.offset(0.001));
    }

    @Test
    @DisplayName("Evaluate positive case with Top-3 hit (not Top-1)")
    void evaluateTop3Hit() {
        RetrievalEvaluationCase testCase = RetrievalEvaluationCase.builder()
                .id("TEST-02")
                .category("TEST")
                .question("Test question")
                .expectedDocumentTitle("Expected Guide")
                .expectNoResult(false)
                .build();

        KnowledgeRetrievalResult chunk1 = KnowledgeRetrievalResult.builder().title("Other Guide 1").score(0.21).build();
        KnowledgeRetrievalResult chunk2 = KnowledgeRetrievalResult.builder().title("Expected Guide").score(0.25).build();

        when(retrievalService.search(any())).thenReturn(List.of(chunk1, chunk2));

        RetrievalEvaluationReport report = evaluationService.evaluate(List.of(testCase));

        assertThat(report.getPassedCases()).isEqualTo(1);
        assertThat(report.getTop1Hits()).isEqualTo(0);
        assertThat(report.getTop3Hits()).isEqualTo(1);
        assertThat(report.getTop3HitRate()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("Evaluate negative case with expected no result")
    void evaluateExpectedNoResult() {
        RetrievalEvaluationCase testCase = RetrievalEvaluationCase.builder()
                .id("TEST-03")
                .category("NEGATIVE")
                .question("Out of domain question")
                .expectNoResult(true)
                .build();

        when(retrievalService.search(any())).thenReturn(Collections.emptyList());

        RetrievalEvaluationReport report = evaluationService.evaluate(List.of(testCase));

        assertThat(report.getPassedCases()).isEqualTo(1);
        assertThat(report.getNoResultCases()).isEqualTo(1);
        assertThat(report.getNoResultRate()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("Evaluate negative case failure when unexpected results returned")
    void evaluateNegativeCaseFailure() {
        RetrievalEvaluationCase testCase = RetrievalEvaluationCase.builder()
                .id("TEST-04")
                .category("NEGATIVE")
                .question("Out of domain question")
                .expectNoResult(true)
                .build();

        KnowledgeRetrievalResult chunk = KnowledgeRetrievalResult.builder().title("Unexpected Guide").score(0.10).build();
        when(retrievalService.search(any())).thenReturn(List.of(chunk));

        RetrievalEvaluationReport report = evaluationService.evaluate(List.of(testCase));

        assertThat(report.getPassedCases()).isEqualTo(0);
        assertThat(report.getFailedCases()).isEqualTo(1);
        assertThat(report.getCaseResults().get(0).getFailureReason()).contains("Expected zero results");
    }
}
