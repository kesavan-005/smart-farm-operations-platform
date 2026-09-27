package com.smartfarm.features.knowledge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Details of a failed document ingestion during knowledge seeding.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeSeedFailure {

    /** File path of the seed document. */
    private String filePath;

    /** Title of the seed document if specified. */
    private String title;

    /** Error reason. */
    private String reason;
}
