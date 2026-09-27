package com.smartfarm.features.knowledge.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeHealthReportDto {
    private boolean healthy;
    private long totalDocuments;
    private long activeDocuments;
    private long draftDocuments;
    private long archivedDocuments;
    private long totalChunks;
    private long totalVectors;

    @Builder.Default
    private long activeDocumentsWithZeroChunksCount = 0;
    @Builder.Default
    private List<UUID> activeDocumentsWithZeroChunks = new ArrayList<>();

    @Builder.Default
    private long chunksWithoutVectorsCount = 0;
    @Builder.Default
    private List<UUID> chunksWithoutVectors = new ArrayList<>();

    @Builder.Default
    private long orphanVectorsCount = 0;
    @Builder.Default
    private List<UUID> orphanVectors = new ArrayList<>();

    @Builder.Default
    private long documentsWithMissingStorageFileCount = 0;
    @Builder.Default
    private List<UUID> documentsWithMissingStorageFile = new ArrayList<>();

    @Builder.Default
    private long documentsWithInvalidIndexingStateCount = 0;
    @Builder.Default
    private List<UUID> documentsWithInvalidIndexingState = new ArrayList<>();

    @Builder.Default
    private long duplicateDocumentIdentitiesCount = 0;
    @Builder.Default
    private List<String> duplicateDocumentIdentities = new ArrayList<>();

    @Builder.Default
    private long documentsWithInvalidMetadataCount = 0;
    @Builder.Default
    private List<UUID> documentsWithInvalidMetadata = new ArrayList<>();
}
