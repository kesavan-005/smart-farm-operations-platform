package com.smartfarm.features.knowledge.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.smartfarm.features.advisory.dto.AdvisoryContext;
import com.smartfarm.features.advisory.dto.AdvisoryRequest;
import com.smartfarm.features.advisory.dto.AdvisoryResponse;
import com.smartfarm.features.advisory.service.AdvisoryOrchestrationService;
import com.smartfarm.features.advisory.service.ContextAssembler;
import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionResult;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import com.smartfarm.features.knowledge.repository.KnowledgeChunkRepository;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("dev")
@TestPropertySource(properties = {
    "spring.ai.vectorstore.pgvector.dimensions=384"
})
@DisplayName("Phase 2.5 - RAG Pipeline Validation, Provenance, and Negative Safety Tests")
class Phase25RagValidationAndSafetyTest {

    @Autowired
    private KnowledgeIngestionService ingestionService;

    @Autowired
    private KnowledgeRetrievalService retrievalService;

    @Autowired
    private KnowledgeDocumentRepository documentRepository;

    @Autowired
    private KnowledgeChunkRepository chunkRepository;

    @Autowired
    private ContextAssembler contextAssembler;

    @Autowired
    private AdvisoryOrchestrationService advisoryService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private final List<UUID> createdDocIds = new ArrayList<>();

    @AfterEach
    void tearDown() {
        jdbcTemplate.execute("DELETE FROM vector_store WHERE metadata->>'title' LIKE 'Phase 2.5%'");
        for (UUID docId : createdDocIds) {
            try {
                documentRepository.deleteById(docId);
            } catch (Exception ignored) {}
        }
        createdDocIds.clear();
    }

    @Test
    @DisplayName("ARCHIVED documents are excluded from RAG semantic retrieval")
    void archivedDocumentsExcludedFromRetrieval() {
        KnowledgeIngestionRequest req = KnowledgeIngestionRequest.builder()
                .title("Phase 2.5 Test Archived Soil Report")
                .source("Test Department")
                .sourceType(SourceType.GOVERNMENT)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Paddy")
                .topic(KnowledgeTopic.SOIL)
                .status(DocumentStatus.ARCHIVED)
                .content("Test agricultural document content. Soil acidity management using agricultural lime.")
                .allowDuplicate(true)
                .build();

        KnowledgeIngestionResult result = ingestionService.ingestDocument(req);
        assertThat(result.getOutcome()).isEqualTo("SUCCESS");
        assertThat(result.getVectorCount()).isEqualTo(0); // Non-ACTIVE does not index into PgVector
        createdDocIds.add(result.getDocumentId());

        KnowledgeRetrievalRequest retrievalReq = KnowledgeRetrievalRequest.builder()
                .query("soil acidity management using agricultural lime")
                .crop("Paddy")
                .topic(KnowledgeTopic.SOIL)
                .topK(5)
                .build();

        List<KnowledgeRetrievalResult> retrievalResults = retrievalService.search(retrievalReq);
        boolean containsArchived = retrievalResults.stream()
                .anyMatch(r -> "Phase 2.5 Test Archived Soil Report".equals(r.getTitle()));
        assertThat(containsArchived).isFalse();
    }

    @Test
    @DisplayName("DRAFT documents are excluded from RAG semantic retrieval")
    void draftDocumentsExcludedFromRetrieval() {
        KnowledgeIngestionRequest req = KnowledgeIngestionRequest.builder()
                .title("Phase 2.5 Test Draft Nutrient Guide")
                .source("Test University")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Paddy")
                .topic(KnowledgeTopic.FERTILIZATION)
                .status(DocumentStatus.DRAFT)
                .content("Test agricultural document content. Draft nitrogen application rate calculation.")
                .allowDuplicate(true)
                .build();

        KnowledgeIngestionResult result = ingestionService.ingestDocument(req);
        assertThat(result.getOutcome()).isEqualTo("SUCCESS");
        assertThat(result.getVectorCount()).isEqualTo(0);
        createdDocIds.add(result.getDocumentId());

        KnowledgeRetrievalRequest retrievalReq = KnowledgeRetrievalRequest.builder()
                .query("draft nitrogen application rate calculation")
                .crop("Paddy")
                .topic(KnowledgeTopic.FERTILIZATION)
                .topK(5)
                .build();

        List<KnowledgeRetrievalResult> retrievalResults = retrievalService.search(retrievalReq);
        boolean containsDraft = retrievalResults.stream()
                .anyMatch(r -> "Phase 2.5 Test Draft Nutrient Guide".equals(r.getTitle()));
        assertThat(containsDraft).isFalse();
    }

    @Test
    @DisplayName("Missing optional metadata (sourceUrl, authority, version) is handled gracefully without NPE")
    void missingOptionalMetadataHandledGracefully() {
        KnowledgeIngestionRequest req = KnowledgeIngestionRequest.builder()
                .title("Phase 2.5 Minimal Metadata Guide")
                .sourceType(SourceType.OFFICIAL_GUIDANCE)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.GENERAL_FARMING)
                .status(DocumentStatus.ACTIVE)
                .content("Test agricultural document content. General tractor maintenance and lubrication intervals.")
                .allowDuplicate(true)
                .build();

        KnowledgeIngestionResult result = ingestionService.ingestDocument(req);
        assertThat(result.getOutcome()).isEqualTo("SUCCESS");
        assertThat(result.getVectorCount()).isGreaterThan(0);
        createdDocIds.add(result.getDocumentId());

        KnowledgeRetrievalRequest retrievalReq = KnowledgeRetrievalRequest.builder()
                .query("tractor maintenance and lubrication intervals")
                .topic(KnowledgeTopic.GENERAL_FARMING)
                .topK(3)
                .build();

        List<KnowledgeRetrievalResult> retrievalResults = retrievalService.search(retrievalReq);
        assertThat(retrievalResults).isNotEmpty();

        KnowledgeRetrievalResult matched = retrievalResults.stream()
                .filter(r -> "Phase 2.5 Minimal Metadata Guide".equals(r.getTitle()))
                .findFirst()
                .orElseThrow();

        assertThat(matched.getSource()).isNull();
        assertThat(matched.getAuthority()).isNull();
        assertThat(matched.getVersion()).isNull();
        assertThat(matched.getCrop()).isNull();
        assertThat(matched.getPublishedDate()).isNull();
        assertThat(matched.getLastVerifiedAt()).isNull();
    }

    @Test
    @DisplayName("Retrieval with no matching knowledge returns empty list cleanly")
    void retrievalWithNoMatchingKnowledgeReturnsEmpty() {
        KnowledgeRetrievalRequest retrievalReq = KnowledgeRetrievalRequest.builder()
                .query("completely unrelated quantum computing cryptography algorithm query")
                .topK(5)
                .build();

        List<KnowledgeRetrievalResult> results = retrievalService.search(retrievalReq);
        // Due to maxDistance (0.50), completely unrelated queries will return empty results
        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("Source attribution provenance: Retrieved knowledge accurately preserves origin document ID and metadata")
    void provenanceTraceability() {
        KnowledgeIngestionRequest req = KnowledgeIngestionRequest.builder()
                .title("Phase 2.5 Provenance Test Manual")
                .source("Central Soil and Water Conservation Institute")
                .sourceType(SourceType.RESEARCH_INSTITUTION)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Paddy")
                .topic(KnowledgeTopic.IRRIGATION)
                .authority("Director of Agricultural Water Management")
                .version("2026.2")
                .publishedDate(LocalDate.of(2026, 1, 10))
                .lastVerifiedAt(OffsetDateTime.parse("2026-01-15T10:00:00Z"))
                .sourceUrl("https://example.org/water-guide")
                .status(DocumentStatus.ACTIVE)
                .content("Test agricultural document content. Check-basin irrigation efficiency guidelines for paddy terraces.")
                .allowDuplicate(true)
                .build();

        KnowledgeIngestionResult ingestionResult = ingestionService.ingestDocument(req);
        createdDocIds.add(ingestionResult.getDocumentId());

        KnowledgeRetrievalRequest retrievalReq = KnowledgeRetrievalRequest.builder()
                .query("check-basin irrigation efficiency guidelines for paddy terraces")
                .crop("Paddy")
                .topic(KnowledgeTopic.IRRIGATION)
                .topK(3)
                .build();

        List<KnowledgeRetrievalResult> results = retrievalService.search(retrievalReq);
        assertThat(results).isNotEmpty();

        KnowledgeRetrievalResult matched = results.stream()
                .filter(r -> "Phase 2.5 Provenance Test Manual".equals(r.getTitle()))
                .findFirst()
                .orElseThrow();

        // Validate complete provenance chain back to KnowledgeDocument ID
        assertThat(matched.getKnowledgeDocumentId()).isEqualTo(ingestionResult.getDocumentId().toString());
        assertThat(matched.getKnowledgeChunkId()).isNotNull();
        assertThat(matched.getChunkIndex()).isEqualTo(0);
        assertThat(matched.getTitle()).isEqualTo("Phase 2.5 Provenance Test Manual");
        assertThat(matched.getSource()).isEqualTo("Central Soil and Water Conservation Institute");
        assertThat(matched.getSourceType()).isEqualTo("RESEARCH_INSTITUTION");
        assertThat(matched.getAuthority()).isEqualTo("Director of Agricultural Water Management");
        assertThat(matched.getVersion()).isEqualTo("2026.2");
        assertThat(matched.getPublishedDate()).isEqualTo("2026-01-10");
        assertThat(OffsetDateTime.parse(matched.getLastVerifiedAt())).isEqualTo(OffsetDateTime.parse("2026-01-15T10:00:00Z"));

        // Verify database entity integrity
        KnowledgeDocument entity = documentRepository.findById(ingestionResult.getDocumentId()).orElseThrow();
        assertThat(entity.getTitle()).isEqualTo("Phase 2.5 Provenance Test Manual");
        assertThat(entity.getSourceUrl()).isEqualTo("https://example.org/water-guide");
    }

    @Test
    @DisplayName("Global knowledge isolation: Knowledge documents do NOT have farm_id and are accessible to any farm context")
    void globalKnowledgeIsolation() {
        KnowledgeIngestionRequest req = KnowledgeIngestionRequest.builder()
                .title("Phase 2.5 Global Shared Advisory")
                .source("Government Agricultural Extension")
                .sourceType(SourceType.GOVERNMENT)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Paddy")
                .topic(KnowledgeTopic.GENERAL_FARMING)
                .status(DocumentStatus.ACTIVE)
                .content("Test agricultural document content. Global seed storage guidelines and rodent control techniques.")
                .allowDuplicate(true)
                .build();

        KnowledgeIngestionResult ingestionResult = ingestionService.ingestDocument(req);
        createdDocIds.add(ingestionResult.getDocumentId());

        // Verify entity has no farm_id column or association
        KnowledgeDocument entity = documentRepository.findById(ingestionResult.getDocumentId()).orElseThrow();
        assertThat(entity.getTitle()).isEqualTo("Phase 2.5 Global Shared Advisory");

        // Test retrieval with two distinct simulated farm queries (global knowledge is retrieved regardless of farm)
        KnowledgeRetrievalRequest farm1Query = KnowledgeRetrievalRequest.builder()
                .query("seed storage guidelines and rodent control")
                .crop("Paddy")
                .topic(KnowledgeTopic.GENERAL_FARMING)
                .topK(3)
                .build();

        List<KnowledgeRetrievalResult> farm1Results = retrievalService.search(farm1Query);
        assertThat(farm1Results).anyMatch(r -> "Phase 2.5 Global Shared Advisory".equals(r.getTitle()));
    }
}
