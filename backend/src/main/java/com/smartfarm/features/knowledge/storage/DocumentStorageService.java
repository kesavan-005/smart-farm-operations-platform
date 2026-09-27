package com.smartfarm.features.knowledge.storage;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.errors.ErrorResponseException;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service managing persistent original document binary storage in MinIO.
 *
 * <p>Isolates binary agricultural documents using structured, sanitized paths:
 * {@code knowledge/{documentId}/{safeFilename}}.
 *
 * <p>This service operates strictly at the file/object layer and contains no RAG logic.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentStorageService {

    private final MinioClient minioClient;
    private final MinioProperties properties;

    /**
     * Stores an original binary document in MinIO under an isolated, sanitized storage key.
     *
     * @param documentId Document unique identifier
     * @param originalFilename Original source filename
     * @param contentType MIME type (e.g. application/pdf, text/plain)
     * @param inputStream Content stream
     * @param sizeBytes Content length in bytes (-1 if unknown)
     * @return The unique safe storage path within the bucket
     */
    public String storeDocument(UUID documentId, String originalFilename, String contentType, InputStream inputStream, long sizeBytes) {
        if (documentId == null) {
            throw new IllegalArgumentException("documentId cannot be null");
        }
        if (inputStream == null) {
            throw new IllegalArgumentException("inputStream cannot be null");
        }

        ensureBucketExists();
        String storagePath = generateStoragePath(documentId, originalFilename);
        String resolvedContentType = (contentType != null && !contentType.isBlank()) ? contentType : "application/octet-stream";

        try {
            long partSize = -1;
            if (sizeBytes < 0) {
                partSize = 10 * 1024 * 1024; // 10MB default part size for unknown stream length
            }

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(properties.getBucketName())
                            .object(storagePath)
                            .stream(inputStream, sizeBytes, partSize)
                            .contentType(resolvedContentType)
                            .build());

            log.info("Stored document in MinIO: bucket='{}', path='{}', size={} bytes",
                    properties.getBucketName(), storagePath, sizeBytes);
            return storagePath;
        } catch (Exception e) {
            log.error("Failed to store document in MinIO at path '{}': {}", storagePath, e.getMessage(), e);
            throw new DocumentStorageException("Failed to store document in MinIO: " + e.getMessage(), e);
        }
    }

    /**
     * Stores an original document from raw byte array.
     */
    public String storeDocument(UUID documentId, String originalFilename, String contentType, byte[] data) {
        if (data == null) {
            throw new IllegalArgumentException("Document data cannot be null");
        }
        return storeDocument(documentId, originalFilename, contentType, new ByteArrayInputStream(data), data.length);
    }

    /**
     * Retrieves an input stream of the stored original document.
     *
     * @param storagePath Storage object path
     * @return Input stream to read document content
     */
    public InputStream getDocumentStream(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            throw new IllegalArgumentException("storagePath cannot be blank");
        }
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(properties.getBucketName())
                            .object(storagePath)
                            .build());
        } catch (Exception e) {
            log.error("Failed to retrieve document from MinIO at path '{}': {}", storagePath, e.getMessage(), e);
            throw new DocumentStorageException("Failed to retrieve document from MinIO: " + e.getMessage(), e);
        }
    }

    /**
     * Retrieves the entire stored document content as bytes.
     *
     * @param storagePath Storage object path
     * @return Byte array of document content
     */
    public byte[] getDocumentBytes(String storagePath) {
        try (InputStream stream = getDocumentStream(storagePath)) {
            return stream.readAllBytes();
        } catch (DocumentStorageException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to read document bytes from MinIO at path '{}': {}", storagePath, e.getMessage(), e);
            throw new DocumentStorageException("Failed to read document bytes: " + e.getMessage(), e);
        }
    }

    /**
     * Checks whether an original document exists at the given storage path.
     *
     * @param storagePath Storage object path
     * @return true if the document exists, false otherwise
     */
    public boolean documentExists(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return false;
        }
        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(properties.getBucketName())
                            .object(storagePath)
                            .build());
            return true;
        } catch (ErrorResponseException e) {
            if ("NoSuchKey".equals(e.errorResponse().code()) || "NoSuchBucket".equals(e.errorResponse().code())) {
                return false;
            }
            throw new DocumentStorageException("Error checking document existence: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new DocumentStorageException("Error checking document existence: " + e.getMessage(), e);
        }
    }

    /**
     * Deletes an original document from storage.
     *
     * @param storagePath Storage object path
     */
    public void deleteDocument(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return;
        }
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(properties.getBucketName())
                            .object(storagePath)
                            .build());
            log.info("Deleted document from MinIO: bucket='{}', path='{}'", properties.getBucketName(), storagePath);
        } catch (Exception e) {
            log.error("Failed to delete document from MinIO at path '{}': {}", storagePath, e.getMessage(), e);
            throw new DocumentStorageException("Failed to delete document: " + e.getMessage(), e);
        }
    }

    /**
     * Generates a safe, isolated storage path for a document.
     * Format: knowledge/{documentId}/{safeFilename}
     */
    public String generateStoragePath(UUID documentId, String originalFilename) {
        if (documentId == null) {
            throw new IllegalArgumentException("documentId cannot be null");
        }
        String safeName = sanitizeFilename(originalFilename);
        return String.format("knowledge/%s/%s", documentId, safeName);
    }

    /**
     * Sanitizes filename to prevent directory traversal and invalid characters.
     */
    public String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "document.bin";
        }
        // Strip any path components (both forward and backward slashes)
        String name = filename.replace("\\", "/");
        int lastSlash = name.lastIndexOf('/');
        if (lastSlash >= 0) {
            name = name.substring(lastSlash + 1);
        }
        // Replace non-alphanumeric, non-safe chars with underscore
        String sanitized = name.replaceAll("[^a-zA-Z0-9._-]", "_");
        // Ensure not empty or hidden
        sanitized = sanitized.replaceAll("^\\.+", "");
        if (sanitized.isBlank()) {
            return "document.bin";
        }
        // Limit length
        if (sanitized.length() > 200) {
            int extIdx = sanitized.lastIndexOf('.');
            String ext = extIdx > 0 ? sanitized.substring(extIdx) : "";
            sanitized = sanitized.substring(0, 190) + ext;
        }
        return sanitized;
    }

    /**
     * Ensures the configured target bucket exists in MinIO.
     */
    public void ensureBucketExists() {
        try {
            boolean found = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(properties.getBucketName()).build());
            if (!found) {
                log.info("Creating MinIO bucket: {}", properties.getBucketName());
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(properties.getBucketName()).build());
            }
        } catch (Exception e) {
            log.error("Failed to verify/create MinIO bucket '{}': {}", properties.getBucketName(), e.getMessage());
            throw new DocumentStorageException("Failed to initialize storage bucket: " + e.getMessage(), e);
        }
    }
}
