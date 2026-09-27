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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

/**
 * Request payload for administrative upload and ingestion of global authoritative agricultural knowledge documents.
 *
 * <p>Strictly excludes farmer-private context (e.g. farmId).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeDocumentUploadRequest {

    private MultipartFile file;

    @NotBlank(message = "Document title is required")
    private String title;

    private String source;

    @NotNull(message = "SourceType is required")
    private SourceType sourceType;

    @NotNull(message = "KnowledgeLanguage is required")
    private KnowledgeLanguage language;

    private String crop;

    @NotNull(message = "KnowledgeTopic is required")
    private KnowledgeTopic topic;

    private String authority;

    private String version;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate publishedDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private OffsetDateTime lastVerifiedAt;

    private String sourceUrl;

    @Builder.Default
    private DocumentStatus status = DocumentStatus.DRAFT;

    private String metadata;
}
