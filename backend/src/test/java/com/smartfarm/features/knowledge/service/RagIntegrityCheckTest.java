package com.smartfarm.features.knowledge.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("prod")
@DisplayName("Phase 2.8.12 - RAG Production Knowledge Base Repeatable Integrity Check")
class RagIntegrityCheckTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Verify complete chain: knowledge_documents -> knowledge_chunks -> vector_store")
    void verifyProductionKnowledgeIntegrity() {
        // 1. Total and Active Documents
        Integer totalDocs = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM knowledge_documents", Integer.class);
        Integer activeDocs = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM knowledge_documents WHERE status = 'ACTIVE'", Integer.class);

        assertThat(totalDocs).isEqualTo(5);
        assertThat(activeDocs).isEqualTo(5);

        // 2. Chunks and Vectors Counts
        Integer totalChunks = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM knowledge_chunks", Integer.class);
        Integer totalVectors = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM vector_store", Integer.class);

        assertThat(totalChunks).isEqualTo(5291);
        assertThat(totalVectors).isEqualTo(5291);

        // 3. Parity Check: Missing Vectors (chunks without vector)
        Integer missingVectors = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM knowledge_chunks kc " +
                "LEFT JOIN vector_store vs ON kc.id::text = vs.metadata->>'knowledgeChunkId' " +
                "WHERE vs.id IS NULL", Integer.class);
        assertThat(missingVectors).isEqualTo(0);

        // 4. Parity Check: Orphan Vectors (vectors without chunk)
        Integer orphanVectors = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM vector_store vs " +
                "LEFT JOIN knowledge_chunks kc ON vs.metadata->>'knowledgeChunkId' = kc.id::text " +
                "WHERE kc.id IS NULL", Integer.class);
        assertThat(orphanVectors).isEqualTo(0);

        // 5. Dimension Check: Every single vector must have dimension = 384
        Integer distinctDims = jdbcTemplate.queryForObject(
                "SELECT count(DISTINCT vector_dims(embedding)) FROM vector_store", Integer.class);
        Integer singleDimValue = jdbcTemplate.queryForObject(
                "SELECT DISTINCT vector_dims(embedding) FROM vector_store", Integer.class);

        assertThat(distinctDims).isEqualTo(1);
        assertThat(singleDimValue).isEqualTo(384);

        // 6. Metadata Linkage Check: vector metadata status must match document status
        Integer statusMismatches = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM vector_store vs " +
                "JOIN knowledge_documents kd ON (vs.metadata->>'knowledgeDocumentId')::uuid = kd.id " +
                "WHERE vs.metadata->>'status' != kd.status", Integer.class);
        assertThat(statusMismatches).isEqualTo(0);

        System.out.printf("=== PRODUCTION KNOWLEDGE INTEGRITY CHECK: PASS ===%n");
        System.out.printf("Active Documents: %d | Total Documents: %d%n", activeDocs, totalDocs);
        System.out.printf("Total Chunks: %d | Total Vectors: %d%n", totalChunks, totalVectors);
        System.out.printf("Missing Vectors: %d | Orphan Vectors: %d%n", missingVectors, orphanVectors);
        System.out.printf("Embedding Dimension: %d (All 5291 vectors)%n", singleDimValue);
        System.out.printf("Status Mismatches: %d%n", statusMismatches);
        System.out.printf("==================================================%n");
    }
}
