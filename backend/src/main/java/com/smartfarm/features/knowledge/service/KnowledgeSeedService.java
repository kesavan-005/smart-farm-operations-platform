package com.smartfarm.features.knowledge.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfarm.features.knowledge.config.KnowledgeSeedProperties;
import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionResult;
import com.smartfarm.features.knowledge.dto.KnowledgeSeedFailure;
import com.smartfarm.features.knowledge.dto.KnowledgeSeedItem;
import com.smartfarm.features.knowledge.dto.KnowledgeSeedManifest;
import com.smartfarm.features.knowledge.dto.KnowledgeSeedResult;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service orchestrating controlled seeding of permanent, trusted agricultural knowledge.
 *
 * <p>Discovers configured seed documents, reads their authoritative metadata from a manifest,
 * enforces idempotency, validates formats, and bridges to the existing MinIO storage
 * and knowledge ingestion pipeline via {@link DocumentIngestionOrchestrator}.
 *
 * <p>Does NOT duplicate text extraction, chunking, embedding, or vector indexing.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeSeedService {

    private final DocumentIngestionOrchestrator orchestrator;
    private final KnowledgeDocumentRepository documentRepository;
    private final KnowledgeSeedProperties properties;
    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    /**
     * Executes knowledge seeding using the application-configured location and manifest filename.
     *
     * @return Summary result of the seeding operation
     */
    public KnowledgeSeedResult seedFromConfiguredLocation() {
        return seedFromLocation(properties.getLocation(), properties.getManifestFile());
    }

    /**
     * Executes knowledge seeding from a specific base location and manifest filename.
     *
     * @param baseLocation Base resource path (e.g. "classpath:knowledge-seed/")
     * @param manifestFileName Manifest file name (e.g. "manifest.json")
     * @return Summary result of the seeding operation
     */
    public KnowledgeSeedResult seedFromLocation(String baseLocation, String manifestFileName) {
        String manifestPath = resolveManifestPath(baseLocation, manifestFileName);
        log.info("Inspecting knowledge seed manifest at '{}'...", manifestPath);

        Resource manifestResource = resourceLoader.getResource(manifestPath);
        if (!manifestResource.exists()) {
            log.info("Knowledge seed manifest '{}' not found. Seed mechanism ready; no real source documents were present for ingestion.", manifestPath);
            return KnowledgeSeedResult.builder()
                    .processed(0)
                    .inserted(0)
                    .skipped(0)
                    .failed(0)
                    .build();
        }

        KnowledgeSeedManifest manifest;
        try (InputStream is = manifestResource.getInputStream()) {
            manifest = objectMapper.readValue(is, KnowledgeSeedManifest.class);
        } catch (Exception e) {
            log.error("Failed to parse knowledge seed manifest at '{}': {}", manifestPath, e.getMessage(), e);
            KnowledgeSeedFailure failure = KnowledgeSeedFailure.builder()
                    .filePath(manifestFileName)
                    .title("Manifest Parsing")
                    .reason("Failed to parse manifest JSON: " + e.getMessage())
                    .build();
            return KnowledgeSeedResult.builder()
                    .processed(1)
                    .inserted(0)
                    .skipped(0)
                    .failed(1)
                    .failures(List.of(failure))
                    .build();
        }

        if (manifest.getDocuments() == null || manifest.getDocuments().isEmpty()) {
            log.info("Knowledge seed manifest loaded with 0 documents. Seed mechanism ready; no real source documents were present for ingestion.");
            return KnowledgeSeedResult.builder()
                    .processed(0)
                    .inserted(0)
                    .skipped(0)
                    .failed(0)
                    .build();
        }

        return seedManifest(manifest, baseLocation);
    }

    /**
     * Ingests a pre-parsed seed manifest with documents located relative to baseLocation.
     *
     * @param manifest Seed manifest containing document descriptors
     * @param baseLocation Base resource path
     * @return Summary result of the seeding operation
     */
    public KnowledgeSeedResult seedManifest(KnowledgeSeedManifest manifest, String baseLocation) {
        KnowledgeSeedResult result = KnowledgeSeedResult.builder().build();

        if (manifest == null || manifest.getDocuments() == null) {
            return result;
        }

        log.info("Starting controlled seed ingestion for {} documents...", manifest.getDocuments().size());

        for (KnowledgeSeedItem item : manifest.getDocuments()) {
            processSeedItem(item, baseLocation, result);
        }

        log.info("Completed knowledge seeding: {}", result.toSummaryString());
        return result;
    }

    private void processSeedItem(KnowledgeSeedItem item, String baseLocation, KnowledgeSeedResult result) {
        result.setProcessed(result.getProcessed() + 1);

        // 1. Validate required metadata
        String validationError = validateItem(item);
        if (validationError != null) {
            log.warn("Validation failed for seed document '{}': {}", item != null ? item.getFilePath() : "null", validationError);
            result.getFailures().add(KnowledgeSeedFailure.builder()
                    .filePath(item != null ? item.getFilePath() : null)
                    .title(item != null ? item.getTitle() : null)
                    .reason(validationError)
                    .build());
            result.setFailed(result.getFailed() + 1);
            return;
        }

        // 2. Check for duplicate ingestion (idempotency)
        if (isDocumentAlreadyPresent(item.getTitle(), item.getVersion(), item.getSource())) {
            log.info("Seed document title='{}', version='{}', source='{}' already exists in repository; skipping duplicate.",
                    item.getTitle(), item.getVersion(), item.getSource());
            result.setSkipped(result.getSkipped() + 1);
            result.getResults().add(KnowledgeIngestionResult.builder()
                    .title(item.getTitle())
                    .outcome("SKIPPED_DUPLICATE")
                    .message("Document with title '" + item.getTitle() + "' already exists.")
                    .build());
            return;
        }

        // 3. Resolve document resource file
        Resource docResource = resolveResource(baseLocation, item.getFilePath());
        if (!docResource.exists()) {
            String errorMsg = "Document file not found at path: " + item.getFilePath();
            log.warn("Seed failure: {}", errorMsg);
            result.getFailures().add(KnowledgeSeedFailure.builder()
                    .filePath(item.getFilePath())
                    .title(item.getTitle())
                    .reason(errorMsg)
                    .build());
            result.setFailed(result.getFailed() + 1);
            return;
        }

        // 4. Validate content type and format
        String contentType = resolveContentType(item.getContentType(), item.getFilePath());
        if (contentType == null) {
            String errorMsg = "Unsupported file format for: " + item.getFilePath() + ". Only PDF, DOCX, and TXT are supported.";
            log.warn("Seed failure: {}", errorMsg);
            result.getFailures().add(KnowledgeSeedFailure.builder()
                    .filePath(item.getFilePath())
                    .title(item.getTitle())
                    .reason(errorMsg)
                    .build());
            result.setFailed(result.getFailed() + 1);
            return;
        }

        // 5. Read binary document content
        byte[] docBytes;
        try (InputStream is = docResource.getInputStream()) {
            docBytes = is.readAllBytes();
        } catch (Exception e) {
            String errorMsg = "Failed to read document bytes: " + e.getMessage();
            log.error("Seed failure for '{}': {}", item.getFilePath(), errorMsg, e);
            result.getFailures().add(KnowledgeSeedFailure.builder()
                    .filePath(item.getFilePath())
                    .title(item.getTitle())
                    .reason(errorMsg)
                    .build());
            result.setFailed(result.getFailed() + 1);
            return;
        }

        if (docBytes.length == 0) {
            String errorMsg = "Document file is empty: " + item.getFilePath();
            log.warn("Seed failure: {}", errorMsg);
            result.getFailures().add(KnowledgeSeedFailure.builder()
                    .filePath(item.getFilePath())
                    .title(item.getTitle())
                    .reason(errorMsg)
                    .build());
            result.setFailed(result.getFailed() + 1);
            return;
        }

        // 6. Build ingestion request
        String originalFilename = (item.getOriginalFilename() != null && !item.getOriginalFilename().isBlank())
                ? item.getOriginalFilename()
                : extractFilename(item.getFilePath());

        KnowledgeIngestionRequest request = KnowledgeIngestionRequest.builder()
                .title(item.getTitle().trim())
                .source(item.getSource())
                .sourceType(item.getSourceType())
                .language(item.getLanguage())
                .crop(item.getCrop())
                .topic(item.getTopic())
                .authority(item.getAuthority())
                .version(item.getVersion())
                .publishedDate(item.getPublishedDate())
                .lastVerifiedAt(item.getLastVerifiedAt())
                .sourceUrl(item.getSourceUrl())
                .status(item.getStatus() != null ? item.getStatus() : DocumentStatus.ACTIVE)
                .metadata(item.getMetadata())
                .allowDuplicate(false)
                .build();

        // 7. Execute MinIO storage + text extraction + existing ingestion pipeline
        try {
            KnowledgeIngestionResult ingestionResult = orchestrator.storeAndIngest(
                    UUID.randomUUID(),
                    originalFilename,
                    contentType,
                    docBytes,
                    request);

            if ("SKIPPED_DUPLICATE".equalsIgnoreCase(ingestionResult.getOutcome())) {
                result.setSkipped(result.getSkipped() + 1);
            } else {
                result.setInserted(result.getInserted() + 1);
            }
            result.getResults().add(ingestionResult);
            log.info("Successfully processed seed document: title='{}', outcome='{}', chunks={}, vectors={}",
                    ingestionResult.getTitle(), ingestionResult.getOutcome(),
                    ingestionResult.getChunkCount(), ingestionResult.getVectorCount());

        } catch (Exception e) {
            log.error("Failed to ingest seed document '{}': {}", item.getFilePath(), e.getMessage(), e);
            result.getFailures().add(KnowledgeSeedFailure.builder()
                    .filePath(item.getFilePath())
                    .title(item.getTitle())
                    .reason("Ingestion failed: " + e.getMessage())
                    .build());
            result.setFailed(result.getFailed() + 1);
        }
    }

    /**
     * Checks whether a document matching title, version, and source already exists.
     *
     * @param title Document title
     * @param version Optional version string
     * @param source Optional source name
     * @return true if already present, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean isDocumentAlreadyPresent(String title, String version, String source) {
        if (title == null || title.isBlank()) {
            return false;
        }
        String cleanTitle = title.trim();
        List<KnowledgeDocument> matches = documentRepository.findAll((root, query, cb) -> cb.equal(root.get("title"), cleanTitle));
        for (KnowledgeDocument doc : matches) {
            if (version != null && version.equalsIgnoreCase(doc.getVersion())) {
                return true;
            }
            if (version == null && doc.getVersion() == null) {
                if (source == null || source.equalsIgnoreCase(doc.getSource())) {
                    return true;
                }
            }
        }
        return false;
    }

    private String validateItem(KnowledgeSeedItem item) {
        if (item == null) {
            return "Item descriptor cannot be null";
        }
        if (item.getFilePath() == null || item.getFilePath().isBlank()) {
            return "filePath is required and cannot be blank";
        }
        if (item.getTitle() == null || item.getTitle().isBlank()) {
            return "title is required and cannot be blank";
        }
        if (item.getSourceType() == null) {
            return "sourceType is required";
        }
        if (item.getLanguage() == null) {
            return "language is required";
        }
        if (item.getTopic() == null) {
            return "topic is required";
        }
        return null;
    }

    private String resolveContentType(String declaredContentType, String filePath) {
        if (declaredContentType != null && !declaredContentType.isBlank()) {
            String lower = declaredContentType.toLowerCase().trim();
            if (lower.contains("pdf")) {
                return "application/pdf";
            }
            if (lower.contains("wordprocessingml") || lower.contains("docx")) {
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            }
            if (lower.contains("text/plain")) {
                return "text/plain";
            }
            return null;
        }
        if (filePath != null) {
            String lower = filePath.toLowerCase().trim();
            if (lower.endsWith(".pdf")) {
                return "application/pdf";
            }
            if (lower.endsWith(".docx")) {
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            }
            if (lower.endsWith(".txt")) {
                return "text/plain";
            }
        }
        return null;
    }

    private String extractFilename(String filePath) {
        if (filePath == null) {
            return "document.bin";
        }
        String normalized = filePath.replace("\\", "/");
        int idx = normalized.lastIndexOf('/');
        return idx >= 0 ? normalized.substring(idx + 1) : normalized;
    }

    private Resource resolveResource(String baseLocation, String relativePath) {
        if (relativePath.startsWith("classpath:") || relativePath.startsWith("file:/") || relativePath.startsWith("/")) {
            return resourceLoader.getResource(relativePath);
        }
        String normalizedBase = baseLocation != null ? baseLocation : "";
        String fullPath = normalizedBase.endsWith("/") ? normalizedBase + relativePath : normalizedBase + "/" + relativePath;
        return resourceLoader.getResource(fullPath);
    }

    private String resolveManifestPath(String baseLocation, String manifestFileName) {
        String normalizedBase = baseLocation != null ? baseLocation : "";
        return normalizedBase.endsWith("/") ? normalizedBase + manifestFileName : normalizedBase + "/" + manifestFileName;
    }
}
