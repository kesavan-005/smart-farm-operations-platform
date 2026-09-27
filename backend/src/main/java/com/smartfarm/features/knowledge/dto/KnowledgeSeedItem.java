package com.smartfarm.features.knowledge.dto;

import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Metadata descriptor for an agricultural knowledge seed document.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeSeedItem {

    /** Relative file path within the seed directory (e.g. "tnau/paddy-guide.pdf"). */
    private String filePath;

    /** Original source filename (optional; derived from filePath if absent). */
    private String originalFilename;

    /** Content MIME type (optional; derived from extension if absent). */
    private String contentType;

    /** Authoritative document title (required). */
    private String title;

    /** Originating source institution (e.g. "Tamil Nadu Agricultural University"). */
    private String source;

    /** Institutional classification of source (required). */
    private SourceType sourceType;

    /** Language of document content (required). */
    private KnowledgeLanguage language;

    /** Target crop if crop-specific (e.g. "Paddy", "Turmeric"). */
    private String crop;

    /** Knowledge domain topic (required). */
    private KnowledgeTopic topic;

    /** Issuing authority or department. */
    private String authority;

    /** Document or edition version string. */
    private String version;

    /** Official publication date. */
    private LocalDate publishedDate;

    /** Date/time document content was last verified. */
    private OffsetDateTime lastVerifiedAt;

    /** Canonical source URL. */
    private String sourceUrl;

    /** Initial document status (defaults to ACTIVE for trusted seeds). */
    @Builder.Default
    private DocumentStatus status = DocumentStatus.ACTIVE;

    /** Additional metadata in JSON string format. */
    private String metadata;
}
