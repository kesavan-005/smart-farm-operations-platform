package com.smartfarm.features.knowledge.service;

import com.smartfarm.common.exception.BadRequestException;
import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.knowledge.config.KnowledgeIngestionProperties;
import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeChunk;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentDetailDto;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentFilter;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentSummaryDto;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentUploadRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentUploadResponse;
import com.smartfarm.features.knowledge.exception.KnowledgeLifecycleException;
import com.smartfarm.features.knowledge.extractor.DocumentTextExtractor;
import com.smartfarm.features.knowledge.repository.KnowledgeChunkRepository;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentSpecification;
import com.smartfarm.features.knowledge.storage.DocumentStorageService;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service managing agricultural knowledge document lifecycle, search, metadata inspection,
 * activation safety checks, and vector indexing synchronization.
 */
import org.springframework.beans.factory.annotation.Autowired;

@Slf4j
@Service
public class KnowledgeManagementService {

    private final KnowledgeDocumentRepository documentRepository;
    private final KnowledgeChunkRepository chunkRepository;
    private final DocumentStorageService storageService;
    private final JdbcOperations jdbcTemplate;
    private final ObjectProvider<PgVectorStore> vectorStoreProvider;
    private final KnowledgeIngestionService ingestionService;
    private final DocumentTextExtractor textExtractor;
    private final TextNormalizer textNormalizer;
    private final DeterministicChunker chunker;
    private final KnowledgeIngestionProperties properties;

    @Autowired
    public KnowledgeManagementService(
            KnowledgeDocumentRepository documentRepository,
            KnowledgeChunkRepository chunkRepository,
            DocumentStorageService storageService,
            JdbcOperations jdbcTemplate,
            ObjectProvider<PgVectorStore> vectorStoreProvider,
            KnowledgeIngestionService ingestionService,
            DocumentTextExtractor textExtractor,
            TextNormalizer textNormalizer,
            DeterministicChunker chunker,
            KnowledgeIngestionProperties properties) {
        this.documentRepository = documentRepository;
        this.chunkRepository = chunkRepository;
        this.storageService = storageService;
        this.jdbcTemplate = jdbcTemplate;
        this.vectorStoreProvider = vectorStoreProvider;
        this.ingestionService = ingestionService;
        this.textExtractor = textExtractor;
        this.textNormalizer = textNormalizer;
        this.chunker = chunker;
        this.properties = properties;
    }

    public KnowledgeManagementService(
            KnowledgeDocumentRepository documentRepository,
            KnowledgeChunkRepository chunkRepository,
            DocumentStorageService storageService,
            JdbcOperations jdbcTemplate,
            ObjectProvider<PgVectorStore> vectorStoreProvider) {
        this(documentRepository, chunkRepository, storageService, jdbcTemplate, vectorStoreProvider,
                null, null, null, null, null);
    }

    @Value("${spring.ai.vectorstore.pgvector.table-name:vector_store}")
    private String vectorTableName = "vector_store";

    /**
     * Lists documents matching filter criteria with pagination.
     */
    @Transactional(readOnly = true)
    public Page<KnowledgeDocumentSummaryDto> listDocuments(KnowledgeDocumentFilter filter, Pageable pageable) {
        Page<KnowledgeDocument> page = documentRepository.findAll(
                KnowledgeDocumentSpecification.withFilter(filter),
                pageable
        );
        return page.map(this::mapToSummaryDto);
    }

    /**
     * Searches documents using free-text query and optional filters.
     */
    @Transactional(readOnly = true)
    public Page<KnowledgeDocumentSummaryDto> searchDocuments(String query, KnowledgeDocumentFilter filter, Pageable pageable) {
        if (filter == null) {
            filter = new KnowledgeDocumentFilter();
        }
        if (StringUtils.hasText(query)) {
            filter.setQuery(query);
        }
        return listDocuments(filter, pageable);
    }

    /**
     * Retrieves full document metadata, storage state, and vector indexing details.
     */
    @Transactional(readOnly = true)
    public KnowledgeDocumentDetailDto getDocumentDetails(UUID documentId) {
        KnowledgeDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge document not found with ID: " + documentId));

        return mapToDetailDto(doc);
    }

    /**
     * Safely activates a document for participation in RAG retrieval.
     * Enforces all activation safety checks:
     * - document exists
     * - valid metadata
     * - file exists in MinIO
     * - chunks exist
     * - every chunk has a corresponding vector in vector_store
     */
    @Transactional
    public KnowledgeDocumentDetailDto activateDocument(UUID documentId) {
        KnowledgeDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge document not found with ID: " + documentId));

        if (doc.getStatus() == DocumentStatus.ACTIVE) {
            throw new KnowledgeLifecycleException("Document is already ACTIVE.");
        }

        // 1. Validate metadata
        validateMetadata(doc);

        // 2. Validate MinIO storage file
        if (!StringUtils.hasText(doc.getStoragePath()) || !storageService.documentExists(doc.getStoragePath())) {
            throw new KnowledgeLifecycleException(
                    "Cannot activate document: original file does not exist in object storage at path '"
                    + (doc.getStoragePath() != null ? doc.getStoragePath() : "null") + "'.");
        }

        // 3. Validate extracted chunks
        long chunkCount = chunkRepository.countByDocument_Id(documentId);
        if (chunkCount == 0) {
            throw new KnowledgeLifecycleException("Cannot activate document: document has no extracted knowledge chunks.");
        }

        // 4. Validate corresponding vector embeddings
        long vectorCount = countVectorsForDocument(documentId);
        if (vectorCount < chunkCount) {
            throw new KnowledgeLifecycleException(
                    "Cannot activate document: " + (chunkCount - vectorCount)
                    + " chunks are missing corresponding vector embeddings in vector_store. All chunks must have vectors before activation.");
        }

        // 5. Update document status to ACTIVE
        doc.setStatus(DocumentStatus.ACTIVE);
        documentRepository.save(doc);

        // 6. Update vector metadata status to ACTIVE so PgVectorStore retrieves them
        updateVectorStatusForDocument(documentId, DocumentStatus.ACTIVE);

        log.info("Successfully activated knowledge document id='{}', title='{}', chunks={}",
                doc.getId(), doc.getTitle(), chunkCount);

        return mapToDetailDto(doc);
    }

    /**
     * Safely archives an active document, retaining full provenance and history
     * while excluding it from future RAG retrieval.
     */
    @Transactional
    public KnowledgeDocumentDetailDto archiveDocument(UUID documentId) {
        KnowledgeDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge document not found with ID: " + documentId));

        if (doc.getStatus() == DocumentStatus.ARCHIVED) {
            throw new KnowledgeLifecycleException("Document is already ARCHIVED.");
        }
        if (doc.getStatus() == DocumentStatus.DRAFT) {
            throw new KnowledgeLifecycleException("Cannot archive document with status DRAFT. Only ACTIVE documents can be archived.");
        }

        doc.setStatus(DocumentStatus.ARCHIVED);
        documentRepository.save(doc);

        // Update vector metadata status to ARCHIVED so RAG retrieval excludes them
        updateVectorStatusForDocument(documentId, DocumentStatus.ARCHIVED);

        log.info("Successfully archived knowledge document id='{}', title='{}'", doc.getId(), doc.getTitle());

        return mapToDetailDto(doc);
    }

    /**
     * Indexes vector embeddings for all chunks of a document into the vector store.
     */
    @Transactional
    public long indexDocumentVectors(UUID documentId) {
        KnowledgeDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge document not found with ID: " + documentId));

        List<KnowledgeChunk> chunks = chunkRepository.findByDocument_IdOrderByChunkIndexAsc(documentId);
        if (chunks.isEmpty()) {
            throw new KnowledgeLifecycleException("Cannot index vectors: document has no extracted chunks.");
        }

        PgVectorStore vectorStore = vectorStoreProvider.getIfAvailable();
        if (vectorStore == null) {
            throw new IllegalStateException("PgVectorStore bean is not available in the current context.");
        }

        List<Document> vectorDocs = ingestionService.buildVectorDocuments(doc, chunks);
        vectorStore.add(vectorDocs);

        log.info("Indexed {} vectors in PgVectorStore for document id='{}'", vectorDocs.size(), doc.getId());
        return vectorDocs.size();
    }

    /**
     * Checks whether an authoritative document already exists for (title, version, source).
     */
    @Transactional(readOnly = true)
    public Optional<KnowledgeDocument> findDuplicateIdentity(String title, String version, String source) {
        if (!StringUtils.hasText(title)) {
            return Optional.empty();
        }
        List<KnowledgeDocument> matches = documentRepository.findAll(
                (root, query, cb) -> cb.equal(cb.lower(root.get("title")), title.trim().toLowerCase())
        );

        for (KnowledgeDocument doc : matches) {
            boolean versionMatch = (version == null && doc.getVersion() == null)
                    || (version != null && version.trim().equalsIgnoreCase(doc.getVersion()));
            boolean sourceMatch = (source == null && doc.getSource() == null)
                    || (source != null && source.trim().equalsIgnoreCase(doc.getSource()));

            if (versionMatch && sourceMatch) {
                return Optional.of(doc);
            }
        }
        return Optional.empty();
    }

    /**
     * Counts vector store entries for chunks belonging to a document.
     */
    public long countVectorsForDocument(UUID documentId) {
        if (!isVectorStoreAvailable()) {
            return 0L;
        }
        try {
            String sql = "SELECT count(*) FROM " + vectorTableName
                    + " WHERE id IN (SELECT id FROM knowledge_chunks WHERE document_id = ?)";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, documentId);
            return count != null ? count.longValue() : 0L;
        } catch (Exception e) {
            log.warn("Could not query vector count for document id='{}': {}", documentId, e.getMessage());
            return 0L;
        }
    }

    /**
     * Updates status in vector metadata for all chunks of a document.
     */
    public void updateVectorStatusForDocument(UUID documentId, DocumentStatus status) {
        if (!isVectorStoreAvailable()) {
            return;
        }
        try {
            String sql = "UPDATE " + vectorTableName
                    + " SET metadata = jsonb_set(metadata::jsonb, '{status}', to_jsonb(?::text))::json"
                    + " WHERE id IN (SELECT id FROM knowledge_chunks WHERE document_id = ?)";
            int updated = jdbcTemplate.update(sql, status.name(), documentId);
            log.info("Updated {} vector records to status='{}' for document id='{}'", updated, status.name(), documentId);
        } catch (Exception e) {
            log.warn("Could not update vector status for document id='{}': {}", documentId, e.getMessage());
        }
    }

    private boolean isVectorStoreAvailable() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.tables WHERE table_name = ?",
                    Integer.class,
                    vectorTableName.toLowerCase()
            );
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private void validateMetadata(KnowledgeDocument doc) {
        if (!StringUtils.hasText(doc.getTitle())) {
            throw new KnowledgeLifecycleException("Cannot activate document: title is required and cannot be blank.");
        }
        if (doc.getSourceType() == null) {
            throw new KnowledgeLifecycleException("Cannot activate document: sourceType is required.");
        }
        if (doc.getLanguage() == null) {
            throw new KnowledgeLifecycleException("Cannot activate document: language is required.");
        }
        if (doc.getTopic() == null) {
            throw new KnowledgeLifecycleException("Cannot activate document: topic is required.");
        }
    }

    private KnowledgeDocumentSummaryDto mapToSummaryDto(KnowledgeDocument doc) {
        long chunkCount = chunkRepository.countByDocument_Id(doc.getId());
        return KnowledgeDocumentSummaryDto.builder()
                .id(doc.getId())
                .title(doc.getTitle())
                .source(doc.getSource())
                .sourceType(doc.getSourceType())
                .language(doc.getLanguage())
                .crop(doc.getCrop())
                .topic(doc.getTopic())
                .authority(doc.getAuthority())
                .version(doc.getVersion())
                .publishedDate(doc.getPublishedDate())
                .status(doc.getStatus())
                .originalFilename(doc.getOriginalFilename())
                .fileSizeBytes(doc.getFileSizeBytes())
                .chunkCount(chunkCount)
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .build();
    }

    private KnowledgeDocumentDetailDto mapToDetailDto(KnowledgeDocument doc) {
        long chunkCount = chunkRepository.countByDocument_Id(doc.getId());
        boolean fileInStorage = StringUtils.hasText(doc.getStoragePath())
                && storageService.documentExists(doc.getStoragePath());
        long vectorCount = countVectorsForDocument(doc.getId());
        boolean indexedInVectorStore = chunkCount > 0 && vectorCount == chunkCount;

        return KnowledgeDocumentDetailDto.builder()
                .id(doc.getId())
                .title(doc.getTitle())
                .source(doc.getSource())
                .sourceType(doc.getSourceType())
                .language(doc.getLanguage())
                .crop(doc.getCrop())
                .topic(doc.getTopic())
                .authority(doc.getAuthority())
                .version(doc.getVersion())
                .publishedDate(doc.getPublishedDate())
                .lastVerifiedAt(doc.getLastVerifiedAt())
                .sourceUrl(doc.getSourceUrl())
                .status(doc.getStatus())
                .originalFilename(doc.getOriginalFilename())
                .contentType(doc.getContentType())
                .fileSizeBytes(doc.getFileSizeBytes())
                .storagePath(doc.getStoragePath())
                .metadata(doc.getMetadata())
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .chunkCount(chunkCount)
                .fileInStorage(fileInStorage)
                .vectorCount(vectorCount)
                .indexedInVectorStore(indexedInVectorStore)
                .build();
    }

    /**
     * Controlled administrative workflow to upload and ingest a global authoritative agricultural knowledge document.
     *
     * <p>Enforces:
     * <ul>
     *   <li>Supported document format (PDF, DOCX, TXT)
     *   <li>Non-empty file and safe filename (no path traversal)
     *   <li>Required metadata validation
     *   <li>Duplicate identity protection (title + version + source)
     *   <li>Original binary document persistence in MinIO
     *   <li>Tika text extraction and normalization
     *   <li>Deterministic text chunking
     *   <li>Relational metadata persistence in PostgreSQL
     *   <li>Vector embedding generation and 384-d PgVector storage
     *   <li>Failure safety: clean rollback and MinIO cleanup on extraction/chunking/indexing error
     * </ul>
     */
    @Transactional
    public KnowledgeDocumentUploadResponse uploadDocument(KnowledgeDocumentUploadRequest request) {
        if (request == null) {
            throw new BadRequestException("Upload request cannot be null.");
        }

        MultipartFile file = request.getFile();
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty.");
        }
        if (file.getSize() <= 0) {
            throw new BadRequestException("Uploaded file is empty (0 bytes).");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BadRequestException("Filename cannot be blank.");
        }
        if (originalFilename.contains("..")) {
            throw new BadRequestException("Invalid filename containing path traversal characters: " + originalFilename);
        }

        String contentType = file.getContentType();
        if (textExtractor == null || !textExtractor.isSupported(originalFilename, contentType)) {
            throw new BadRequestException(
                    "Unsupported document format for file '" + originalFilename + "'. Supported formats are PDF, DOCX, and TXT.");
        }

        // Validate required metadata
        if (!StringUtils.hasText(request.getTitle())) {
            throw new BadRequestException("Document title is required.");
        }
        if (request.getSourceType() == null) {
            throw new BadRequestException("SourceType is required.");
        }
        if (request.getLanguage() == null) {
            throw new BadRequestException("KnowledgeLanguage is required.");
        }
        if (request.getTopic() == null) {
            throw new BadRequestException("KnowledgeTopic is required.");
        }

        String cleanTitle = request.getTitle().trim();
        String cleanVersion = StringUtils.hasText(request.getVersion()) ? request.getVersion().trim() : null;
        String cleanSource = StringUtils.hasText(request.getSource()) ? request.getSource().trim() : null;

        // Check for duplicate document identity (title + version + source)
        Optional<KnowledgeDocument> duplicate = findDuplicateIdentity(cleanTitle, cleanVersion, cleanSource);
        if (duplicate.isPresent()) {
            throw new KnowledgeLifecycleException(
                    String.format("Duplicate document rejected: Document with title '%s', version '%s', and source '%s' already exists (id='%s').",
                            cleanTitle, cleanVersion != null ? cleanVersion : "null", cleanSource != null ? cleanSource : "null", duplicate.get().getId()));
        }

        // 1. Store original binary document in MinIO
        UUID documentId = UUID.randomUUID();
        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (Exception e) {
            throw new BadRequestException("Failed to read uploaded file bytes: " + e.getMessage(), e);
        }

        String storagePath = storageService.storeDocument(documentId, originalFilename, contentType, fileBytes);

        // 2. Extract text using Tika
        String extractedText;
        try {
            extractedText = textExtractor.extractText(fileBytes, originalFilename, contentType);
        } catch (Exception e) {
            try { storageService.deleteDocument(storagePath); } catch (Exception ignored) {}
            log.error("Text extraction failed for document '{}': {}", originalFilename, e.getMessage());
            throw new BadRequestException("Failed to extract text from document '" + originalFilename + "': " + e.getMessage(), e);
        }

        if (!StringUtils.hasText(extractedText)) {
            try { storageService.deleteDocument(storagePath); } catch (Exception ignored) {}
            throw new BadRequestException("Document contains no extractable text: " + originalFilename);
        }

        // 3. Normalize text
        String normalizedText = textNormalizer != null ? textNormalizer.normalize(extractedText) : extractedText.trim();
        if (!StringUtils.hasText(normalizedText)) {
            try { storageService.deleteDocument(storagePath); } catch (Exception ignored) {}
            throw new BadRequestException("Extracted content is blank after text normalization.");
        }

        // 4. Deterministic chunking
        int chunkSize = (properties != null) ? properties.getChunkSize() : 1000;
        int chunkOverlap = (properties != null) ? properties.getChunkOverlap() : 150;
        List<String> chunkTexts = (chunker != null)
                ? chunker.chunk(normalizedText, chunkSize, chunkOverlap)
                : List.of(normalizedText);

        if (chunkTexts.isEmpty()) {
            try { storageService.deleteDocument(storagePath); } catch (Exception ignored) {}
            throw new BadRequestException("Document content produced 0 chunks.");
        }

        // 5. Persist KnowledgeDocument
        DocumentStatus docStatus = request.getStatus() != null ? request.getStatus() : DocumentStatus.DRAFT;

        KnowledgeDocument doc = KnowledgeDocument.builder()
                .id(documentId)
                .title(cleanTitle)
                .source(cleanSource)
                .sourceType(request.getSourceType())
                .language(request.getLanguage())
                .crop(StringUtils.hasText(request.getCrop()) ? request.getCrop().trim() : null)
                .topic(request.getTopic())
                .authority(StringUtils.hasText(request.getAuthority()) ? request.getAuthority().trim() : null)
                .version(cleanVersion)
                .publishedDate(request.getPublishedDate())
                .lastVerifiedAt(request.getLastVerifiedAt())
                .sourceUrl(StringUtils.hasText(request.getSourceUrl()) ? request.getSourceUrl().trim() : null)
                .originalFilename(originalFilename)
                .contentType(contentType)
                .fileSizeBytes((long) fileBytes.length)
                .storagePath(storagePath)
                .status(docStatus)
                .metadata(request.getMetadata())
                .build();

        doc = documentRepository.save(doc);

        // 6. Persist KnowledgeChunks
        List<KnowledgeChunk> chunks = new ArrayList<>();
        for (int i = 0; i < chunkTexts.size(); i++) {
            KnowledgeChunk chunk = KnowledgeChunk.builder()
                    .document(doc)
                    .chunkIndex(i)
                    .content(chunkTexts.get(i))
                    .language(request.getLanguage())
                    .metadata(String.format("{\"document_id\": \"%s\", \"chunk_index\": %d, \"topic\": \"%s\"}",
                            doc.getId(), i, doc.getTopic()))
                    .build();
            chunks.add(chunk);
        }
        List<KnowledgeChunk> savedChunks = chunkRepository.saveAll(chunks);
        doc.setChunks(savedChunks);
        documentRepository.flush();

        // 7. Generate vector embeddings and store in PgVectorStore
        int vectorCount = 0;
        PgVectorStore vectorStore = vectorStoreProvider.getIfAvailable();
        if (vectorStore != null && ingestionService != null) {
            try {
                List<Document> vectorDocs = ingestionService.buildVectorDocuments(doc, savedChunks);
                vectorStore.add(vectorDocs);
                vectorCount = vectorDocs.size();
                log.info("Inserted {} vector records into PgVectorStore for newly uploaded document id='{}' (status: {})",
                        vectorCount, doc.getId(), doc.getStatus());
            } catch (Exception e) {
                log.error("Failed to generate vector embeddings for document id='{}'", doc.getId(), e);
                try { storageService.deleteDocument(storagePath); } catch (Exception ignored) {}
                throw new IllegalStateException("Vector embedding generation failed for document '" + doc.getTitle() + "': " + e.getMessage(), e);
            }
        }

        log.info("Successfully ingested global agricultural knowledge document id='{}', title='{}', chunks={}, vectors={}, status={}",
                doc.getId(), doc.getTitle(), savedChunks.size(), vectorCount, doc.getStatus());

        return KnowledgeDocumentUploadResponse.builder()
                .documentId(doc.getId())
                .title(doc.getTitle())
                .source(doc.getSource())
                .sourceType(doc.getSourceType())
                .language(doc.getLanguage())
                .crop(doc.getCrop())
                .topic(doc.getTopic())
                .authority(doc.getAuthority())
                .version(doc.getVersion())
                .publishedDate(doc.getPublishedDate())
                .lastVerifiedAt(doc.getLastVerifiedAt())
                .sourceUrl(doc.getSourceUrl())
                .status(doc.getStatus())
                .originalFilename(doc.getOriginalFilename())
                .contentType(doc.getContentType())
                .fileSizeBytes(doc.getFileSizeBytes())
                .chunkCount(savedChunks.size())
                .vectorCount(vectorCount)
                .storagePath(doc.getStoragePath())
                .ingestionStatus("INGESTED")
                .createdAt(doc.getCreatedAt())
                .build();
    }
}
