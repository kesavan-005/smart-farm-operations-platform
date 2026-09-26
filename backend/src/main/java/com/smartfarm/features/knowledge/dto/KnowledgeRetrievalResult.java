package com.smartfarm.features.knowledge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Phase 4A-1: Result DTO for semantic knowledge retrieval.
 * Preserves complete Phase 3B source traceability without exposing internal entities.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeRetrievalResult {

    private String content;
    private Double score; // Raw score from Spring AI/PgVectorStore

    // Metadata
    private String knowledgeDocumentId;
    private String knowledgeChunkId;
    private Integer chunkIndex;
    private String title;
    private String source;
    private String sourceType;
    private String language;
    private String crop;
    private String topic;
    private String authority;
    private String version;
    private String publishedDate;
    private String lastVerifiedAt;
}
