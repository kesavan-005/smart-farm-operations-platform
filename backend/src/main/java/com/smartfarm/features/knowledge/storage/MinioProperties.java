package com.smartfarm.features.knowledge.storage;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for MinIO object storage.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "minio")
public class MinioProperties {

    /** MinIO server endpoint (e.g. http://localhost:9000). */
    private String endpoint = "http://localhost:9000";

    /** MinIO access key / username. */
    private String accessKey = "minioadmin";

    /** MinIO secret key / password. */
    private String secretKey = "minioadmin123";

    /** Target bucket name for agricultural knowledge documents. */
    private String bucketName = "smartfarm-knowledge";
}
