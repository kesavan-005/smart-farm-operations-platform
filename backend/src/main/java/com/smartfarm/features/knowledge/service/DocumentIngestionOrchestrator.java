package com.smartfarm.features.knowledge.service;

import com.smartfarm.common.exception.BadRequestException;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionResult;
import com.smartfarm.features.knowledge.extractor.DocumentTextExtractor;
import com.smartfarm.features.knowledge.storage.DocumentStorageService;
import java.io.InputStream;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orchestrator bridging persistent MinIO document storage, text extraction,
 * and the existing KnowledgeIngestionService pipeline.
 *
 * <p>Flow:
 * <ol>
 *   <li>Retrieves original binary document stream from MinIO (or stores it first)
 *   <li>Extracts clean text content via {@link DocumentTextExtractor}
 *   <li>Preserves all agricultural and storage metadata
 *   <li>Delegates to existing {@link KnowledgeIngestionService} for normalization, chunking,
 *       relational storage, and 384-d PgVector indexing (if ACTIVE)
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentIngestionOrchestrator {

    private final DocumentStorageService storageService;
    private final DocumentTextExtractor textExtractor;
    private final KnowledgeIngestionService ingestionService;

    /**
     * Ingests a document that has already been stored in MinIO.
     *
     * @param request Ingestion request containing document metadata and valid {@code storagePath}
     * @return Result of the ingestion pipeline
     */
    @Transactional
    public KnowledgeIngestionResult ingestStoredDocument(KnowledgeIngestionRequest request) {
        if (request == null) {
            throw new BadRequestException("Ingestion request cannot be null.");
        }
        if (request.getStoragePath() == null || request.getStoragePath().isBlank()) {
            throw new BadRequestException("storagePath is required to ingest a stored document.");
        }

        log.info("Starting text extraction and ingestion for stored document: path='{}', title='{}'",
                request.getStoragePath(), request.getTitle());

        // 1. Fetch document stream directly from MinIO
        try (InputStream stream = storageService.getDocumentStream(request.getStoragePath())) {
            // 2. Extract text using Tika
            String extractedText = textExtractor.extractText(
                    stream,
                    request.getOriginalFilename(),
                    request.getContentType());

            // 3. Attach extracted text to existing ingestion request
            request.setContent(extractedText);

            // 4. Delegate to existing KnowledgeIngestionService
            return ingestionService.ingestDocument(request);

        } catch (Exception e) {
            log.error("Failed during document extraction and ingestion for path '{}': {}",
                    request.getStoragePath(), e.getMessage(), e);
            if (e instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw new IllegalStateException("Failed to process document: " + e.getMessage(), e);
        }
    }

    /**
     * Convenience pipeline: stores original binary document in MinIO, extracts text,
     * and delegates to existing ingestion service in a single integrated flow.
     *
     * @param documentId Unique identifier to isolate document in storage
     * @param originalFilename Original source filename
     * @param contentType MIME type
     * @param documentBytes Raw document bytes
     * @param request Ingestion metadata request
     * @return Ingestion result
     */
    @Transactional
    public KnowledgeIngestionResult storeAndIngest(
            UUID documentId,
            String originalFilename,
            String contentType,
            byte[] documentBytes,
            KnowledgeIngestionRequest request) {

        if (documentId == null) {
            documentId = UUID.randomUUID();
        }
        if (documentBytes == null || documentBytes.length == 0) {
            throw new BadRequestException("Document content cannot be empty.");
        }

        // 1. Store original binary document in MinIO
        String storagePath = storageService.storeDocument(documentId, originalFilename, contentType, documentBytes);

        // 2. Preserve storage metadata
        request.setStoragePath(storagePath);
        request.setOriginalFilename(originalFilename);
        request.setContentType(contentType);
        request.setFileSizeBytes((long) documentBytes.length);

        // 3. Ingest stored document
        return ingestStoredDocument(request);
    }
}
