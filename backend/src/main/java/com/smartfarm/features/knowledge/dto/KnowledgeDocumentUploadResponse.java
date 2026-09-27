package com.smartfarm.features.knowledge.dto;

import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Detailed response returned after uploading and ingesting an authoritative agricultural knowledge document.
 *
 * <p>Exposes document provenance, storage details, chunk counts, vector indexing metrics, and ingestion status,
 * while strictly safeguarding credentials and system secrets.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeDocumentUploadResponse {

    private UUID documentId;
    private String title;
    private String source;
    private SourceType sourceType;
    private KnowledgeLanguage language;
    private String crop;
    private KnowledgeTopic topic;
    private String authority;
    private String version;
    private LocalDate publishedDate;
    private OffsetDateTime lastVerifiedAt;
    private String sourceUrl;
    private DocumentStatus status;
    private String originalFilename;
    private String contentType;
    private Long fileSizeBytes;
    private int chunkCount;
    private int vectorCount;
    private String storagePath;
    private String ingestionStatus;
    private OffsetDateTime createdAt;
}
