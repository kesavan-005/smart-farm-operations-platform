package com.smartfarm.features.knowledge.service;

import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.dto.KnowledgeHealthReportDto;
import com.smartfarm.features.knowledge.repository.KnowledgeChunkRepository;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import com.smartfarm.features.knowledge.storage.DocumentStorageService;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Diagnostic service performing deep health and integrity checks across the
 * agricultural knowledge repository (PostgreSQL metadata, chunks, MinIO object storage,
 * and PgVectorStore embeddings).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeHealthService {

    private final KnowledgeDocumentRepository documentRepository;
    private final KnowledgeChunkRepository chunkRepository;
    private final DocumentStorageService storageService;
    private final JdbcOperations jdbcTemplate;

    @Value("${spring.ai.vectorstore.pgvector.table-name:vector_store}")
    private String vectorTableName = "vector_store";

    /**
     * Generates a comprehensive, read-only diagnostic knowledge health report.
     */
    @Transactional(readOnly = true)
    public KnowledgeHealthReportDto generateHealthReport() {
        log.info("Generating comprehensive knowledge repository health report...");

        long totalDocs = documentRepository.count();
        long activeDocs = documentRepository.countByStatus(DocumentStatus.ACTIVE);
        long draftDocs = documentRepository.countByStatus(DocumentStatus.DRAFT);
        long archivedDocs = documentRepository.countByStatus(DocumentStatus.ARCHIVED);
        long totalChunks = chunkRepository.count();
        long totalVectors = countTotalVectors();

        List<KnowledgeDocument> allDocuments = documentRepository.findAll();

        // 1. ACTIVE documents with zero chunks
        List<UUID> activeZeroChunks = new ArrayList<>();
        for (KnowledgeDocument doc : allDocuments) {
            if (doc.getStatus() == DocumentStatus.ACTIVE) {
                long chunks = chunkRepository.countByDocument_Id(doc.getId());
                if (chunks == 0) {
                    activeZeroChunks.add(doc.getId());
                }
            }
        }

        // 2. Chunks without vectors
        List<UUID> chunksWithoutVectors = findChunkIdsWithoutVectors();

        // 3. Orphan vectors (in vector_store but no chunk in relational DB)
        List<UUID> orphanVectors = findOrphanVectorIds();

        // 4. Documents whose MinIO object is missing
        List<UUID> missingStorageFiles = new ArrayList<>();
        for (KnowledgeDocument doc : allDocuments) {
            if (!StringUtils.hasText(doc.getStoragePath()) || !storageService.documentExists(doc.getStoragePath())) {
                missingStorageFiles.add(doc.getId());
            }
        }

        // 5. Documents with invalid status/indexing state (e.g. ACTIVE with vectorCount != chunkCount)
        List<UUID> invalidIndexingState = new ArrayList<>();
        for (KnowledgeDocument doc : allDocuments) {
            long chunks = chunkRepository.countByDocument_Id(doc.getId());
            long vectors = countVectorsForDocument(doc.getId());
            if (doc.getStatus() == DocumentStatus.ACTIVE && chunks != vectors) {
                invalidIndexingState.add(doc.getId());
            }
        }

        // 6. Duplicate document identities (title + version + source)
        List<String> duplicateIdentities = findDuplicateDocumentIdentities();

        // 7. Documents with invalid metadata
        List<UUID> invalidMetadata = new ArrayList<>();
        for (KnowledgeDocument doc : allDocuments) {
            if (!StringUtils.hasText(doc.getTitle())
                    || doc.getSourceType() == null
                    || doc.getLanguage() == null
                    || doc.getTopic() == null) {
                invalidMetadata.add(doc.getId());
            }
        }

        boolean healthy = activeZeroChunks.isEmpty()
                && chunksWithoutVectors.isEmpty()
                && orphanVectors.isEmpty()
                && missingStorageFiles.isEmpty()
                && invalidIndexingState.isEmpty()
                && duplicateIdentities.isEmpty()
                && invalidMetadata.isEmpty();

        log.info("Knowledge health report generated. Overall healthy={}, totalDocs={}, activeDocs={}, totalChunks={}, totalVectors={}",
                healthy, totalDocs, activeDocs, totalChunks, totalVectors);

        return KnowledgeHealthReportDto.builder()
                .healthy(healthy)
                .totalDocuments(totalDocs)
                .activeDocuments(activeDocs)
                .draftDocuments(draftDocs)
                .archivedDocuments(archivedDocs)
                .totalChunks(totalChunks)
                .totalVectors(totalVectors)
                .activeDocumentsWithZeroChunksCount(activeZeroChunks.size())
                .activeDocumentsWithZeroChunks(activeZeroChunks)
                .chunksWithoutVectorsCount(chunksWithoutVectors.size())
                .chunksWithoutVectors(chunksWithoutVectors)
                .orphanVectorsCount(orphanVectors.size())
                .orphanVectors(orphanVectors)
                .documentsWithMissingStorageFileCount(missingStorageFiles.size())
                .documentsWithMissingStorageFile(missingStorageFiles)
                .documentsWithInvalidIndexingStateCount(invalidIndexingState.size())
                .documentsWithInvalidIndexingState(invalidIndexingState)
                .duplicateDocumentIdentitiesCount(duplicateIdentities.size())
                .duplicateDocumentIdentities(duplicateIdentities)
                .documentsWithInvalidMetadataCount(invalidMetadata.size())
                .documentsWithInvalidMetadata(invalidMetadata)
                .build();
    }

    private long countTotalVectors() {
        if (!isVectorStoreAvailable()) {
            return 0L;
        }
        try {
            Integer count = jdbcTemplate.queryForObject("SELECT count(*) FROM " + vectorTableName, Integer.class);
            return count != null ? count.longValue() : 0L;
        } catch (Exception e) {
            log.warn("Could not query total vectors from {}: {}", vectorTableName, e.getMessage());
            return 0L;
        }
    }

    private long countVectorsForDocument(UUID documentId) {
        if (!isVectorStoreAvailable()) {
            return 0L;
        }
        try {
            String sql = "SELECT count(*) FROM " + vectorTableName
                    + " WHERE id IN (SELECT id FROM knowledge_chunks WHERE document_id = ?)";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, documentId);
            return count != null ? count.longValue() : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    private List<UUID> findChunkIdsWithoutVectors() {
        if (!isVectorStoreAvailable()) {
            return List.of();
        }
        try {
            String sql = "SELECT c.id FROM knowledge_chunks c WHERE NOT EXISTS (SELECT 1 FROM "
                    + vectorTableName + " v WHERE v.id = c.id)";
            return jdbcTemplate.query(sql, (rs, rowNum) -> rs.getObject("id", UUID.class));
        } catch (Exception e) {
            log.warn("Could not check chunks without vectors: {}", e.getMessage());
            return List.of();
        }
    }

    private List<UUID> findOrphanVectorIds() {
        if (!isVectorStoreAvailable()) {
            return List.of();
        }
        try {
            String sql = "SELECT v.id FROM " + vectorTableName
                    + " v WHERE NOT EXISTS (SELECT 1 FROM knowledge_chunks c WHERE c.id = v.id)";
            return jdbcTemplate.query(sql, (rs, rowNum) -> rs.getObject("id", UUID.class));
        } catch (Exception e) {
            log.warn("Could not check orphan vectors: {}", e.getMessage());
            return List.of();
        }
    }

    private List<String> findDuplicateDocumentIdentities() {
        try {
            String sql = "SELECT title, COALESCE(version, '') as ver, COALESCE(source, '') as src, count(*) as cnt "
                    + "FROM knowledge_documents "
                    + "GROUP BY title, COALESCE(version, ''), COALESCE(source, '') "
                    + "HAVING count(*) > 1";
            return jdbcTemplate.query(sql, (rs, rowNum) -> String.format(
                    "title='%s' [version='%s', source='%s'] (count: %d)",
                    rs.getString("title"),
                    rs.getString("ver"),
                    rs.getString("src"),
                    rs.getLong("cnt")
            ));
        } catch (Exception e) {
            log.warn("Could not check duplicate document identities: {}", e.getMessage());
            return List.of();
        }
    }

    private boolean isVectorStoreAvailable() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.tables WHERE table_name = ?",
                    Integer.class,
                    vectorTableName.toLowerCase()
            );
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }
}
