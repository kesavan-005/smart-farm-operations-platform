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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeDocumentSummaryDto {
    private UUID id;
    private String title;
    private String source;
    private SourceType sourceType;
    private KnowledgeLanguage language;
    private String crop;
    private KnowledgeTopic topic;
    private String authority;
    private String version;
    private LocalDate publishedDate;
    private DocumentStatus status;
    private String originalFilename;
    private Long fileSizeBytes;
    private long chunkCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
