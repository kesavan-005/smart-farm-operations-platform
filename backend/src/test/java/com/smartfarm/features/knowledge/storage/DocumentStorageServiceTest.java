package com.smartfarm.features.knowledge.storage;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.GetObjectResponse;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.errors.ErrorResponseException;
import io.minio.messages.ErrorResponse;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import okhttp3.Headers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentStorageServiceTest {

    @Mock
    private MinioClient minioClient;

    private MinioProperties properties;
    private DocumentStorageService storageService;

    @BeforeEach
    void setUp() {
        properties = new MinioProperties();
        properties.setBucketName("test-bucket");
        properties.setEndpoint("http://localhost:9000");
        storageService = new DocumentStorageService(minioClient, properties);
    }

    @Nested
    @DisplayName("Storage Key & Filename Sanitization")
    class StorageKeyTests {

        @Test
        @DisplayName("Should generate safe isolated storage path format knowledge/{documentId}/{safeFilename}")
        void generateStoragePath_FormatsCorrectly() {
            UUID docId = UUID.fromString("11111111-1111-1111-1111-111111111111");
            String path = storageService.generateStoragePath(docId, "TNAU_Paddy_Guide.pdf");

            assertThat(path).isEqualTo("knowledge/11111111-1111-1111-1111-111111111111/TNAU_Paddy_Guide.pdf");
        }

        @Test
        @DisplayName("Should reject null documentId")
        void generateStoragePath_RejectsNullDocId() {
            assertThatThrownBy(() -> storageService.generateStoragePath(null, "test.pdf"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("documentId cannot be null");
        }

        @Test
        @DisplayName("Should sanitize directory traversal and backslashes")
        void sanitizeFilename_PreventsPathTraversal() {
            String sanitized = storageService.sanitizeFilename("../../../etc/passwd");
            assertThat(sanitized).doesNotContain("..").doesNotContain("/").isEqualTo("passwd");

            String winSanitized = storageService.sanitizeFilename("..\\..\\secret\\guide.pdf");
            assertThat(winSanitized).doesNotContain("\\").doesNotContain("..").isEqualTo("guide.pdf");
        }

        @Test
        @DisplayName("Should replace special characters with underscores")
        void sanitizeFilename_ReplacesSpecialChars() {
            String sanitized = storageService.sanitizeFilename("Tamil Nadu Crop Guide (2026) [v1.0] #1!.pdf");
            assertThat(sanitized).isEqualTo("Tamil_Nadu_Crop_Guide__2026___v1.0___1_.pdf");
        }

        @Test
        @DisplayName("Should fall back to document.bin when filename is empty or blank")
        void sanitizeFilename_HandlesEmptyFilename() {
            assertThat(storageService.sanitizeFilename(null)).isEqualTo("document.bin");
            assertThat(storageService.sanitizeFilename("   ")).isEqualTo("document.bin");
            assertThat(storageService.sanitizeFilename("....")).isEqualTo("document.bin");
        }
    }

    @Nested
    @DisplayName("Document Store Operations")
    class StoreOperationsTests {

        @Test
        @DisplayName("Should store document bytes into MinIO bucket")
        void storeDocument_Bytes_Success() throws Exception {
            UUID docId = UUID.randomUUID();
            byte[] content = "Sample Agricultural Guide Content".getBytes(StandardCharsets.UTF_8);

            when(minioClient.bucketExists(any(BucketExistsArgs.class))).thenReturn(true);

            String storagePath = storageService.storeDocument(docId, "paddy_diseases.pdf", "application/pdf", content);

            assertThat(storagePath).startsWith("knowledge/" + docId + "/");
            assertThat(storagePath).endsWith("paddy_diseases.pdf");

            verify(minioClient).putObject(any(PutObjectArgs.class));
        }

        @Test
        @DisplayName("Should create bucket if it does not exist")
        void storeDocument_CreatesBucketIfMissing() throws Exception {
            UUID docId = UUID.randomUUID();
            byte[] content = "Content".getBytes(StandardCharsets.UTF_8);

            when(minioClient.bucketExists(any(BucketExistsArgs.class))).thenReturn(false);

            storageService.storeDocument(docId, "test.txt", "text/plain", content);

            verify(minioClient).makeBucket(any());
            verify(minioClient).putObject(any(PutObjectArgs.class));
        }

        @Test
        @DisplayName("Should throw DocumentStorageException when MinIO putObject fails")
        void storeDocument_ThrowsOnMinioError() throws Exception {
            UUID docId = UUID.randomUUID();
            byte[] content = "Content".getBytes(StandardCharsets.UTF_8);

            when(minioClient.bucketExists(any(BucketExistsArgs.class))).thenReturn(true);
            doThrow(new RuntimeException("MinIO connection timed out"))
                    .when(minioClient).putObject(any(PutObjectArgs.class));

            assertThatThrownBy(() -> storageService.storeDocument(docId, "test.txt", "text/plain", content))
                    .isInstanceOf(DocumentStorageException.class)
                    .hasMessageContaining("Failed to store document in MinIO");
        }

        @Test
        @DisplayName("Should validate required parameters")
        void storeDocument_ValidatesInputs() {
            assertThatThrownBy(() -> storageService.storeDocument(null, "f.pdf", "app/pdf", (byte[]) null))
                    .isInstanceOf(IllegalArgumentException.class);

            UUID docId = UUID.randomUUID();
            assertThatThrownBy(() -> storageService.storeDocument(docId, "f.pdf", "app/pdf", (byte[]) null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Document data cannot be null");
        }
    }

    @Nested
    @DisplayName("Document Retrieval & Existence")
    class RetrieveOperationsTests {

        @Test
        @DisplayName("Should retrieve document bytes from MinIO")
        void getDocumentBytes_Success() throws Exception {
            String storagePath = "knowledge/test/sample.pdf";
            byte[] expectedData = "Binary Document Data".getBytes(StandardCharsets.UTF_8);

            GetObjectResponse mockResponse = mock(GetObjectResponse.class);
            when(mockResponse.readAllBytes()).thenReturn(expectedData);
            when(minioClient.getObject(any(GetObjectArgs.class))).thenReturn(mockResponse);

            byte[] retrieved = storageService.getDocumentBytes(storagePath);

            assertThat(retrieved).isEqualTo(expectedData);
        }

        @Test
        @DisplayName("Should return true when document exists in MinIO")
        void documentExists_ReturnsTrueWhenFound() throws Exception {
            String storagePath = "knowledge/test/sample.pdf";
            StatObjectResponse mockStat = mock(StatObjectResponse.class);
            when(minioClient.statObject(any(StatObjectArgs.class))).thenReturn(mockStat);

            boolean exists = storageService.documentExists(storagePath);

            assertThat(exists).isTrue();
        }

        @Test
        @DisplayName("Should return false when document does not exist in MinIO (NoSuchKey)")
        void documentExists_ReturnsFalseWhenNotFound() throws Exception {
            String storagePath = "knowledge/test/missing.pdf";
            ErrorResponse errorResponse = mock(ErrorResponse.class);
            when(errorResponse.code()).thenReturn("NoSuchKey");
            ErrorResponseException ex = new ErrorResponseException(errorResponse, null, null);

            when(minioClient.statObject(any(StatObjectArgs.class))).thenThrow(ex);

            boolean exists = storageService.documentExists(storagePath);

            assertThat(exists).isFalse();
        }

        @Test
        @DisplayName("Should return false for null or blank storagePath")
        void documentExists_ReturnsFalseForBlank() {
            assertThat(storageService.documentExists(null)).isFalse();
            assertThat(storageService.documentExists("   ")).isFalse();
        }

        @Test
        @DisplayName("Should delete document from MinIO")
        void deleteDocument_Success() throws Exception {
            String storagePath = "knowledge/test/to-delete.pdf";

            storageService.deleteDocument(storagePath);

            verify(minioClient).removeObject(any(RemoveObjectArgs.class));
        }

        @Test
        @DisplayName("Should safely ignore blank path for deleteDocument")
        void deleteDocument_NoOpOnBlank() throws Exception {
            storageService.deleteDocument(null);
            storageService.deleteDocument("   ");
            // No exception thrown
        }
    }
}
