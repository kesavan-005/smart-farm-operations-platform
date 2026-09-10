package com.smartfarm.features.advisory.dto;

import com.smartfarm.features.knowledge.domain.SourceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Phase 5A: DTO representing a source of knowledge retrieved for grounding.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdvisorySource {
    private String knowledgeDocumentId;
    private String knowledgeChunkId;
    private Integer chunkIndex;
    private String title;
    private String source;
    private SourceType sourceType;
    private String authority;
    private String version;
    private LocalDate publishedDate;
    private Instant lastVerifiedAt;
    private Double score;
}
