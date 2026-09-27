package com.smartfarm.features.knowledge.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import com.smartfarm.features.knowledge.dto.KnowledgeSeedResult;
import com.smartfarm.features.knowledge.repository.KnowledgeChunkRepository;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import com.smartfarm.features.knowledge.storage.DocumentStorageService;
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
@DisplayName("Phase 2.4 - Controlled Knowledge Seed Integration and Idempotency Test")
class KnowledgeSeedIntegrationTest {

    @Autowired
    private KnowledgeSeedService seedService;

    @Autowired
    private DocumentStorageService storageService;

    @Autowired
    private KnowledgeRetrievalService retrievalService;

    @Autowired
    private KnowledgeDocumentRepository documentRepository;

    @Autowired
    private KnowledgeChunkRepository chunkRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private String storedPathToDelete;
    private UUID createdDocId;

    @AfterEach
    void tearDown() {
        if (storedPathToDelete != null) {
            try {
                storageService.deleteDocument(storedPathToDelete);
            } catch (Exception ignored) {}
        }
        if (createdDocId != null) {
            try {
                jdbcTemplate.execute("DELETE FROM vector_store WHERE metadata->>'knowledgeDocumentId' = '" + createdDocId + "'");
                documentRepository.deleteById(createdDocId);
            } catch (Exception ignored) {}
        }
    }

    @Test
    @DisplayName("Should seed from test manifest, store in MinIO, index in PgVector, enforce idempotency on second run, and retrieve via RAG")
    void endToEndSeedAndIdempotency() {
        // Run 1: First seed import
        KnowledgeSeedResult firstResult = seedService.seedFromLocation(
                "classpath:knowledge-seed-test/", "manifest.json");

        assertThat(firstResult.getProcessed()).isEqualTo(1);
        assertThat(firstResult.getInserted()).isEqualTo(1);
        assertThat(firstResult.getSkipped()).isEqualTo(0);
        assertThat(firstResult.getFailed()).isEqualTo(0);
        assertThat(firstResult.getFailures()).isEmpty();
        assertThat(firstResult.getResults()).hasSize(1);

        createdDocId = firstResult.getResults().get(0).getDocumentId();

        // Verify relational persistence
        KnowledgeDocument persistedDoc = documentRepository.findById(createdDocId).orElseThrow();
        assertThat(persistedDoc.getTitle()).isEqualTo("Test Agricultural Guidance 2026");
        assertThat(persistedDoc.getSourceType()).isEqualTo(SourceType.AGRICULTURAL_UNIVERSITY);
        assertThat(persistedDoc.getStatus()).isEqualTo(DocumentStatus.ACTIVE);
        assertThat(persistedDoc.getStoragePath()).isNotNull();
        storedPathToDelete = persistedDoc.getStoragePath();

        // Verify MinIO storage
        assertThat(storageService.documentExists(persistedDoc.getStoragePath())).isTrue();

        // Verify chunk persistence
        var chunks = chunkRepository.findByDocument_IdOrderByChunkIndexAsc(createdDocId);
        assertThat(chunks).isNotEmpty();
        assertThat(chunks.get(0).getContent()).contains("Test agricultural document content");

        // Verify RAG semantic retrieval
        KnowledgeRetrievalRequest retrievalRequest = KnowledgeRetrievalRequest.builder()
                .query("crop spacing and drip irrigation scheduling")
                .crop("Paddy")
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .topK(3)
                .build();

        List<KnowledgeRetrievalResult> retrievalResults = retrievalService.search(retrievalRequest);
        assertThat(retrievalResults).isNotEmpty();
        assertThat(retrievalResults.get(0).getTitle()).isEqualTo("Test Agricultural Guidance 2026");

        // Run 2: Second run of the exact same seed manifest - must be idempotent!
        KnowledgeSeedResult secondResult = seedService.seedFromLocation(
                "classpath:knowledge-seed-test/", "manifest.json");

        assertThat(secondResult.getProcessed()).isEqualTo(1);
        assertThat(secondResult.getInserted()).isEqualTo(0);
        assertThat(secondResult.getSkipped()).isEqualTo(1); // Idempotently skipped
        assertThat(secondResult.getFailed()).isEqualTo(0);

        // Verify that document count and chunk count did not double
        List<KnowledgeDocument> allMatches = documentRepository.findAll((root, query, cb) ->
                cb.equal(root.get("title"), "Test Agricultural Guidance 2026"));
        assertThat(allMatches).hasSize(1);
    }
}
