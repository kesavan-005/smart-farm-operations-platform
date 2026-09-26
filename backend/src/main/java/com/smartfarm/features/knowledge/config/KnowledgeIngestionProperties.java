package com.smartfarm.features.knowledge.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for agricultural knowledge ingestion and chunking.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "smartfarm.knowledge.ingestion")
public class KnowledgeIngestionProperties {

    /** Approximate target chunk size in characters. */
    private int chunkSize = 1000;

    /** Overlap size in characters between adjacent chunks. */
    private int chunkOverlap = 150;
}
