package com.smartfarm.features.knowledge.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for controlled knowledge seeding.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "smartfarm.knowledge.seed")
public class KnowledgeSeedProperties {

    /**
     * Whether automatic knowledge seeding is enabled on application startup.
     * Default is false to prevent unexpected indexing during local development.
     */
    private boolean enabled = false;

    /**
     * Base resource location for seed documents and manifest.
     * Example: "classpath:knowledge-seed/" or "file:/path/to/seed/"
     */
    private String location = "classpath:knowledge-seed/";

    /**
     * Manifest file name relative to the base location.
     */
    private String manifestFile = "manifest.json";
}
