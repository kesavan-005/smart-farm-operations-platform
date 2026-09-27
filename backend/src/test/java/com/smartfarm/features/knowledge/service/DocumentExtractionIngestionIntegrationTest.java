package com.smartfarm.features.knowledge.service;

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
import com.smartfarm.features.knowledge.storage.DocumentStorageService;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("dev")
@TestPropertySource(properties = {
    "spring.ai.vectorstore.pgvector.dimensions=384"
})
@DisplayName("Phase 2.3 - Document Extraction and Ingestion End-to-End Integration Test")
class DocumentExtractionIngestionIntegrationTest {

    @Autowired
    private DocumentIngestionOrchestrator orchestrator;

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
    @DisplayName("Should extract, ingest ACTIVE document, store in MinIO, create chunks, index in PgVector, and retrieve via RAG")
    void endToEndExtractionIngestionAndRetrieval_ActiveDocument() {
        UUID docId = UUID.randomUUID();
        String filename = "tnau_paddy_blast_2026.txt";
        String contentType = "text/plain";
        String textContent = "TNAU Crop Protection Guide 2026 for Paddy Blast.\n\n"
                + "Paddy Blast is caused by Magnaporthe oryzae fungus. "
                + "Symptoms include spindle-shaped lesions with grey centers on leaves. "
                + "Management: Apply Tricyclazole 75% WP @ 1g/L of water at early heading stage. "
                + "Avoid excess nitrogen fertilizer during cloudy conditions.";
        byte[] docBytes = textContent.getBytes(StandardCharsets.UTF_8);

        KnowledgeIngestionRequest metadata = KnowledgeIngestionRequest.builder()
                .title("TNAU Paddy Blast Guide 2026")
                .source("Tamil Nadu Agricultural University")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Paddy")
                .topic(KnowledgeTopic.DISEASE_MANAGEMENT)
                .authority("TNAU Coimbatore")
                .version("2026.1")
                .publishedDate(LocalDate.of(2026, 2, 1))
                .status(DocumentStatus.ACTIVE)
                .allowDuplicate(true)
                .build();

        // 1. Store in MinIO, extract text with Tika, and ingest through existing KnowledgeIngestionService
        KnowledgeIngestionResult result = orchestrator.storeAndIngest(
                docId, filename, contentType, docBytes, metadata);

        assertThat(result).isNotNull();
        assertThat(result.getOutcome()).isEqualTo("SUCCESS");
        assertThat(result.getChunkCount()).isGreaterThan(0);
        assertThat(result.getVectorCount()).isGreaterThan(0);

        createdDocId = result.getDocumentId();
        storedPathToDelete = metadata.getStoragePath();

        // 2. Verify KnowledgeDocument in database has preserved storage metadata
        KnowledgeDocument persistedDoc = documentRepository.findById(createdDocId).orElseThrow();
        assertThat(persistedDoc.getTitle()).isEqualTo("TNAU Paddy Blast Guide 2026");
        assertThat(persistedDoc.getStoragePath()).isEqualTo(metadata.getStoragePath());
        assertThat(persistedDoc.getOriginalFilename()).isEqualTo(filename);
        assertThat(persistedDoc.getContentType()).isEqualTo(contentType);
        assertThat(persistedDoc.getFileSizeBytes()).isEqualTo((long) docBytes.length);
        assertThat(persistedDoc.getStatus()).isEqualTo(DocumentStatus.ACTIVE);

        // 3. Verify KnowledgeChunks exist in PostgreSQL
        var chunks = chunkRepository.findByDocument_IdOrderByChunkIndexAsc(createdDocId);
        assertThat(chunks).isNotEmpty();
        assertThat(chunks.get(0).getContent()).contains("TNAU Crop Protection Guide 2026");

        // 4. Verify MinIO has the original file
        assertThat(storageService.documentExists(metadata.getStoragePath())).isTrue();

        // 5. Verify RAG retrieval finds the newly indexed document
        KnowledgeRetrievalRequest retrievalRequest = KnowledgeRetrievalRequest.builder()
                .query("How to manage Paddy Blast disease with Tricyclazole?")
                .crop("Paddy")
                .topic(KnowledgeTopic.DISEASE_MANAGEMENT)
                .topK(3)
                .build();

        List<KnowledgeRetrievalResult> retrievalResults = retrievalService.search(retrievalRequest);
        assertThat(retrievalResults).isNotEmpty();
        assertThat(retrievalResults.get(0).getTitle()).isEqualTo("TNAU Paddy Blast Guide 2026");
        assertThat(retrievalResults.get(0).getContent()).contains("Tricyclazole");
    }

    @Test
    @DisplayName("Should extract and ingest DRAFT document: chunks saved to DB, but PgVector indexing is skipped")
    void endToEndExtractionIngestion_DraftDocument() {
        UUID docId = UUID.randomUUID();
        String filename = "draft_banana_guide.txt";
        String contentType = "text/plain";
        String textContent = "Draft Agricultural Notes for Grand Naine Banana spacing and irrigation.";
        byte[] docBytes = textContent.getBytes(StandardCharsets.UTF_8);

        KnowledgeIngestionRequest metadata = KnowledgeIngestionRequest.builder()
                .title("Draft Banana Notes 2026")
                .source("Farmer Extension Service")
                .sourceType(SourceType.EXTENSION_SERVICE)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Banana")
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .status(DocumentStatus.DRAFT)
                .allowDuplicate(true)
                .build();

        KnowledgeIngestionResult result = orchestrator.storeAndIngest(
                docId, filename, contentType, docBytes, metadata);

        assertThat(result.getOutcome()).isEqualTo("SUCCESS");
        assertThat(result.getChunkCount()).isGreaterThan(0);
        assertThat(result.getVectorCount()).isEqualTo(0); // DRAFT does not insert into PgVector

        createdDocId = result.getDocumentId();
        storedPathToDelete = metadata.getStoragePath();

        // Verify relational persistence
        KnowledgeDocument persistedDoc = documentRepository.findById(createdDocId).orElseThrow();
        assertThat(persistedDoc.getStatus()).isEqualTo(DocumentStatus.DRAFT);
        assertThat(persistedDoc.getStoragePath()).isNotNull();

        var chunks = chunkRepository.findByDocument_IdOrderByChunkIndexAsc(createdDocId);
        assertThat(chunks).isNotEmpty();
    }
}
