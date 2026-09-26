package com.smartfarm.features.knowledge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Phase 4A-1: Request DTO for semantic knowledge retrieval.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeRetrievalRequest {

    /**
     * The search query to be embedded and compared against the vector database.
     */
    private String query;

    /**
     * The number of top results to return.
     */
    @Builder.Default
    private int topK = 5;

    /**
     * Optional filter for a specific crop.
     */
    private String crop;

    /**
     * Optional filter for a specific topic.
     */
    private com.smartfarm.features.knowledge.domain.KnowledgeTopic topic;

    /**
     * Optional filter for a specific language.
     */
    private com.smartfarm.features.knowledge.domain.KnowledgeLanguage language;
}
