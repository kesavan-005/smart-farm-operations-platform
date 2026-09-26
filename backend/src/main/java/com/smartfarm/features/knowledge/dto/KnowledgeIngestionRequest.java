package com.smartfarm.features.knowledge.dto;

import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Service request object for ingesting agricultural knowledge into Smart FARM RAG knowledge base.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeIngestionRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String source;

    @NotNull(message = "Source type is required")
    private SourceType sourceType;

    @NotNull(message = "Language is required")
    private KnowledgeLanguage language;

    private String crop;

    @NotNull(message = "Topic is required")
    private KnowledgeTopic topic;

    private String authority;

    private String version;

    private LocalDate publishedDate;

    private OffsetDateTime lastVerifiedAt;

    private String sourceUrl;

    @Builder.Default
    private DocumentStatus status = DocumentStatus.DRAFT;

    private String metadata;

    @NotBlank(message = "Content is required and cannot be blank")
    private String content;

    @Builder.Default
    private boolean allowDuplicate = false;
}
