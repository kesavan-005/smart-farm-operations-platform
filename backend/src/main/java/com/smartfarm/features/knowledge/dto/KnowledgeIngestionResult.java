package com.smartfarm.features.knowledge.dto;

import com.smartfarm.features.knowledge.domain.DocumentStatus;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Service result object summarizing the outcome of a knowledge document ingestion operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeIngestionResult {

    private UUID documentId;
    private String title;
    private DocumentStatus status;
    private int chunkCount;
    private int vectorCount;
    private String outcome;
    private String message;
}
