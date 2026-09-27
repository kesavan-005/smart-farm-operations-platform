package com.smartfarm.features.knowledge.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.dto.KnowledgeHealthReportDto;
import com.smartfarm.features.knowledge.repository.KnowledgeChunkRepository;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import com.smartfarm.features.knowledge.storage.DocumentStorageService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("Phase 2.6 - Knowledge Health Diagnostic Service Unit Tests")
class KnowledgeHealthServiceTest {

    @Mock
    private KnowledgeDocumentRepository documentRepository;

    @Mock
    private KnowledgeChunkRepository chunkRepository;

    @Mock
    private JdbcOperations jdbcTemplate;

    private boolean storageFileExists = true;
    private DocumentStorageService storageService;

    private KnowledgeHealthService healthService;

    private UUID docId;
    private KnowledgeDocument validDoc;

    @BeforeEach
    void setUp() {
        storageFileExists = true;
        storageService = new DocumentStorageService(null, null) {
            @Override
            public boolean documentExists(String storagePath) {
                return storageFileExists;
            }
        };

        healthService = new KnowledgeHealthService(documentRepository, chunkRepository, storageService, jdbcTemplate);

        docId = UUID.randomUUID();
        validDoc = KnowledgeDocument.builder()
                .id(docId)
                .title("ICAR Kharif Advisory")
                .source("ICAR")
                .sourceType(SourceType.RESEARCH_INSTITUTION)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .status(DocumentStatus.ACTIVE)
                .storagePath("knowledge/" + docId + "/icar.pdf")
                .build();

        ReflectionTestUtils.setField(healthService, "vectorTableName", "vector_store");
    }

    @Test
    @DisplayName("generateHealthReport: returns healthy=true when all repository integrity checks pass")
    void testHealthyRepository() {
        when(documentRepository.count()).thenReturn(1L);
        when(documentRepository.countByStatus(DocumentStatus.ACTIVE)).thenReturn(1L);
        when(documentRepository.countByStatus(DocumentStatus.DRAFT)).thenReturn(0L);
        when(documentRepository.countByStatus(DocumentStatus.ARCHIVED)).thenReturn(0L);
        when(chunkRepository.count()).thenReturn(10L);
        when(documentRepository.findAll()).thenReturn(List.of(validDoc));

        // Storage exists
        storageFileExists = true;

        // Chunks and vectors match
        when(chunkRepository.countByDocument_Id(docId)).thenReturn(10L);

        // Vector store table exists
        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM information_schema.tables WHERE table_name = ?"),
                eq(Integer.class),
                eq("vector_store"))).thenReturn(1);
        when(jdbcTemplate.queryForObject(eq("SELECT count(*) FROM vector_store"), eq(Integer.class))).thenReturn(10);
        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM vector_store WHERE id IN (SELECT id FROM knowledge_chunks WHERE document_id = ?)"),
                eq(Integer.class),
                eq(docId))).thenReturn(10);

        // No chunks without vectors
        when(jdbcTemplate.query(
                eq("SELECT c.id FROM knowledge_chunks c WHERE NOT EXISTS (SELECT 1 FROM vector_store v WHERE v.id = c.id)"),
                any(RowMapper.class))).thenReturn(List.of());

        // No orphan vectors
        when(jdbcTemplate.query(
                eq("SELECT v.id FROM vector_store v WHERE NOT EXISTS (SELECT 1 FROM knowledge_chunks c WHERE c.id = v.id)"),
                any(RowMapper.class))).thenReturn(List.of());

        // No duplicate identities
        when(jdbcTemplate.query(
                eq("SELECT title, version, source, COUNT(*) as cnt FROM knowledge_documents GROUP BY title, version, source HAVING COUNT(*) > 1"),
                any(RowMapper.class))).thenReturn(List.of());

        KnowledgeHealthReportDto report = healthService.generateHealthReport();

        assertThat(report.isHealthy()).isTrue();
        assertThat(report.getTotalDocuments()).isEqualTo(1);
        assertThat(report.getActiveDocuments()).isEqualTo(1);
        assertThat(report.getTotalChunks()).isEqualTo(10);
        assertThat(report.getTotalVectors()).isEqualTo(10);
        assertThat(report.getChunksWithoutVectorsCount()).isEqualTo(0);
        assertThat(report.getOrphanVectorsCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("generateHealthReport: detects ACTIVE document with zero chunks")
    void testDetectActiveDocWithZeroChunks() {
        when(documentRepository.findAll()).thenReturn(List.of(validDoc));
        when(chunkRepository.countByDocument_Id(docId)).thenReturn(0L);

        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM information_schema.tables WHERE table_name = ?"),
                eq(Integer.class),
                eq("vector_store"))).thenReturn(1);

        KnowledgeHealthReportDto report = healthService.generateHealthReport();

        assertThat(report.isHealthy()).isFalse();
        assertThat(report.getActiveDocumentsWithZeroChunksCount()).isEqualTo(1);
        assertThat(report.getActiveDocumentsWithZeroChunks()).contains(docId);
    }

    @Test
    @DisplayName("generateHealthReport: detects chunks without vectors")
    void testDetectChunksWithoutVectors() {
        when(documentRepository.findAll()).thenReturn(List.of());
        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM information_schema.tables WHERE table_name = ?"),
                eq(Integer.class),
                eq("vector_store"))).thenReturn(1);

        UUID missingChunkId = UUID.randomUUID();
        when(jdbcTemplate.query(
                eq("SELECT c.id FROM knowledge_chunks c WHERE NOT EXISTS (SELECT 1 FROM vector_store v WHERE v.id = c.id)"),
                any(RowMapper.class))).thenReturn(List.of(missingChunkId));

        KnowledgeHealthReportDto report = healthService.generateHealthReport();

        assertThat(report.isHealthy()).isFalse();
        assertThat(report.getChunksWithoutVectorsCount()).isEqualTo(1);
        assertThat(report.getChunksWithoutVectors()).contains(missingChunkId);
    }

    @Test
    @DisplayName("generateHealthReport: detects orphan vectors")
    void testDetectOrphanVectors() {
        when(documentRepository.findAll()).thenReturn(List.of());
        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM information_schema.tables WHERE table_name = ?"),
                eq(Integer.class),
                eq("vector_store"))).thenReturn(1);

        UUID orphanVectorId = UUID.randomUUID();
        when(jdbcTemplate.query(
                eq("SELECT v.id FROM vector_store v WHERE NOT EXISTS (SELECT 1 FROM knowledge_chunks c WHERE c.id = v.id)"),
                any(RowMapper.class))).thenReturn(List.of(orphanVectorId));

        KnowledgeHealthReportDto report = healthService.generateHealthReport();

        assertThat(report.isHealthy()).isFalse();
        assertThat(report.getOrphanVectorsCount()).isEqualTo(1);
        assertThat(report.getOrphanVectors()).contains(orphanVectorId);
    }

    @Test
    @DisplayName("generateHealthReport: detects document with missing MinIO storage file")
    void testDetectMissingStorageFile() {
        when(documentRepository.findAll()).thenReturn(List.of(validDoc));
        storageFileExists = false; // Missing in storage!

        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM information_schema.tables WHERE table_name = ?"),
                eq(Integer.class),
                eq("vector_store"))).thenReturn(1);

        KnowledgeHealthReportDto report = healthService.generateHealthReport();

        assertThat(report.isHealthy()).isFalse();
        assertThat(report.getDocumentsWithMissingStorageFileCount()).isEqualTo(1);
        assertThat(report.getDocumentsWithMissingStorageFile()).contains(docId);
    }

    @Test
    @DisplayName("generateHealthReport: detects ACTIVE document with invalid indexing state (chunk/vector mismatch)")
    void testDetectInvalidIndexingState() {
        when(documentRepository.findAll()).thenReturn(List.of(validDoc));
        when(chunkRepository.countByDocument_Id(docId)).thenReturn(10L);

        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM information_schema.tables WHERE table_name = ?"),
                eq(Integer.class),
                eq("vector_store"))).thenReturn(1);

        // Vector count does not match chunk count (e.g. 5 vectors instead of 10)
        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM vector_store WHERE id IN (SELECT id FROM knowledge_chunks WHERE document_id = ?)"),
                eq(Integer.class),
                eq(docId))).thenReturn(5);

        KnowledgeHealthReportDto report = healthService.generateHealthReport();

        assertThat(report.isHealthy()).isFalse();
        assertThat(report.getDocumentsWithInvalidIndexingStateCount()).isEqualTo(1);
        assertThat(report.getDocumentsWithInvalidIndexingState()).contains(docId);
    }

    @Test
    @DisplayName("generateHealthReport: detects invalid metadata on documents")
    void testDetectInvalidMetadata() {
        KnowledgeDocument invalidDoc = KnowledgeDocument.builder()
                .id(UUID.randomUUID())
                .title("") // Blank title
                .source("ICAR")
                .status(DocumentStatus.ACTIVE)
                .build();

        when(documentRepository.findAll()).thenReturn(List.of(invalidDoc));
        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM information_schema.tables WHERE table_name = ?"),
                eq(Integer.class),
                eq("vector_store"))).thenReturn(1);

        KnowledgeHealthReportDto report = healthService.generateHealthReport();

        assertThat(report.isHealthy()).isFalse();
        assertThat(report.getDocumentsWithInvalidMetadataCount()).isEqualTo(1);
        assertThat(report.getDocumentsWithInvalidMetadata()).contains(invalidDoc.getId());
    }
}
