package com.smartfarm.features.knowledge.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary result of a knowledge seeding execution.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeSeedResult {

    /** Total number of seed documents processed. */
    private int processed;

    /** Number of newly inserted and indexed documents. */
    private int inserted;

    /** Number of documents skipped because they already existed. */
    private int skipped;

    /** Number of documents that failed processing or validation. */
    private int failed;

    /** Detailed list of failures. */
    @Builder.Default
    private List<KnowledgeSeedFailure> failures = new ArrayList<>();

    /** Detailed list of individual ingestion results. */
    @Builder.Default
    private List<KnowledgeIngestionResult> results = new ArrayList<>();

    public String toSummaryString() {
        return String.format("Processed: %d, Inserted: %d, Skipped: %d, Failed: %d",
                processed, inserted, skipped, failed);
    }
}
