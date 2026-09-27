package com.smartfarm.features.knowledge.storage;

import io.minio.MinioClient;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("dev")
@DisplayName("Phase 2.2 - MinIO Document Storage Integration Test")
class DocumentStorageIntegrationTest {

    @Autowired
    private DocumentStorageService storageService;

    @Autowired
    private MinioProperties minioProperties;

    @Autowired
    private MinioClient minioClient;

    @Test
    @DisplayName("Should store, verify existence, retrieve bytes, and delete document in live MinIO")
    void endToEndDocumentStorage_Success() {
        UUID docId = UUID.randomUUID();
        String originalFilename = "TNAU_Paddy_Production_Guidelines_2026.pdf";
        String contentType = "application/pdf";
        byte[] content = "Official Agricultural Knowledge Guide - Paddy Production 2026 - TNAU".getBytes(StandardCharsets.UTF_8);

        // 1. Store
        String storagePath = storageService.storeDocument(docId, originalFilename, contentType, content);
        assertThat(storagePath).isEqualTo(String.format("knowledge/%s/TNAU_Paddy_Production_Guidelines_2026.pdf", docId));

        // 2. Exists
        boolean exists = storageService.documentExists(storagePath);
        assertThat(exists).isTrue();

        // 3. Retrieve
        byte[] retrievedBytes = storageService.getDocumentBytes(storagePath);
        assertThat(retrievedBytes).isEqualTo(content);

        // 4. Delete
        storageService.deleteDocument(storagePath);

        // 5. Verify deleted
        boolean existsAfterDelete = storageService.documentExists(storagePath);
        assertThat(existsAfterDelete).isFalse();
    }
}
