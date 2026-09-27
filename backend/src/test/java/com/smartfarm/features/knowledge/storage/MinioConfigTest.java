package com.smartfarm.features.knowledge.storage;

import io.minio.MinioClient;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MinioConfigTest {

    @Test
    @DisplayName("Should initialize MinIO properties with default values")
    void minioProperties_DefaultValues() {
        MinioProperties properties = new MinioProperties();
        assertThat(properties.getEndpoint()).isEqualTo("http://localhost:9000");
        assertThat(properties.getAccessKey()).isEqualTo("minioadmin");
        assertThat(properties.getSecretKey()).isEqualTo("minioadmin123");
        assertThat(properties.getBucketName()).isEqualTo("smartfarm-knowledge");
    }

    @Test
    @DisplayName("Should build MinioClient bean from properties")
    void minioClient_InitializesSuccessfully() {
        MinioProperties properties = new MinioProperties();
        properties.setEndpoint("http://localhost:9000");
        properties.setAccessKey("test-key");
        properties.setSecretKey("test-secret");
        properties.setBucketName("test-bucket");

        MinioConfig config = new MinioConfig(properties);
        MinioClient client = config.minioClient();

        assertThat(client).isNotNull();
    }
}
