package com.smartfarm.features.knowledge.service;

import com.smartfarm.common.exception.BadRequestException;
import com.smartfarm.features.knowledge.config.KnowledgeIngestionProperties;
import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeChunk;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionResult;
import com.smartfarm.features.knowledge.repository.KnowledgeChunkRepository;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Core service managing agricultural knowledge document ingestion, normalization,
 * chunking, relational persistence, and vector embedding storage.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeIngestionService {

    private final KnowledgeDocumentRepository documentRepository;
    private final KnowledgeChunkRepository chunkRepository;
    private final TextNormalizer textNormalizer;
    private final DeterministicChunker chunker;
    private final KnowledgeIngestionProperties properties;
    private final ObjectProvider<PgVectorStore> vectorStoreProvider;

    @Transactional
    public KnowledgeIngestionResult ingestDocument(KnowledgeIngestionRequest request) {
        validateRequest(request);

        String title = request.getTitle().trim();
        String version = request.getVersion() != null ? request.getVersion().trim() : null;

        // Check for duplicate ingestion
        Optional<KnowledgeDocument> existingDoc = findExistingDuplicate(title, version, request.getSource());
        if (existingDoc.isPresent()) {
            if (!request.isAllowDuplicate()) {
                log.info("Ingestion skipped for duplicate document title='{}', version='{}'", title, version);
                return KnowledgeIngestionResult.builder()
                        .documentId(existingDoc.get().getId())
                        .title(title)
                        .status(existingDoc.get().getStatus())
                        .chunkCount(existingDoc.get().getChunks().size())
                        .vectorCount(0)
                        .outcome("SKIPPED_DUPLICATE")
                        .message("Document with title '" + title + "' already exists.")
                        .build();
            } else {
                // Delete existing document and its chunks / vectors before re-ingestion
                deleteDocumentAndVectors(existingDoc.get());
            }
        }

        // 1. Text Normalization
        String normalizedContent = textNormalizer.normalize(request.getContent());
        if (normalizedContent.isBlank()) {
            throw new BadRequestException("Content is blank after text normalization.");
        }

        // 2. Create KnowledgeDocument Entity
        KnowledgeDocument document = KnowledgeDocument.builder()
                .title(title)
                .source(request.getSource())
                .sourceType(request.getSourceType())
                .language(request.getLanguage())
                .crop(request.getCrop())
                .topic(request.getTopic())
                .authority(request.getAuthority())
                .version(version)
                .publishedDate(request.getPublishedDate())
                .lastVerifiedAt(request.getLastVerifiedAt())
                .sourceUrl(request.getSourceUrl())
                .status(request.getStatus() != null ? request.getStatus() : DocumentStatus.DRAFT)
                .metadata(request.getMetadata())
                .build();

        KnowledgeDocument savedDocument = documentRepository.save(document);

        // 3. Deterministic Chunking
        List<String> chunkTexts = chunker.chunk(
                normalizedContent,
                properties.getChunkSize(),
                properties.getChunkOverlap()
        );

        List<KnowledgeChunk> chunks = new ArrayList<>();
        for (int i = 0; i < chunkTexts.size(); i++) {
            KnowledgeChunk chunk = KnowledgeChunk.builder()
                    .document(savedDocument)
                    .chunkIndex(i)
                    .content(chunkTexts.get(i))
                    .language(request.getLanguage())
                    .metadata(buildChunkMetadata(savedDocument, i))
                    .build();
            chunks.add(chunk);
        }

        List<KnowledgeChunk> savedChunks = chunkRepository.saveAll(chunks);
        savedDocument.setChunks(savedChunks);
        documentRepository.flush();

        log.info("Persisted KnowledgeDocument id='{}', title='{}', chunks={}", savedDocument.getId(), savedDocument.getTitle(), savedChunks.size());

        // 4. Vector Storage for ACTIVE documents
        int vectorCount = 0;
        if (savedDocument.getStatus() == DocumentStatus.ACTIVE) {
            PgVectorStore vectorStore = vectorStoreProvider.getIfAvailable();
            if (vectorStore != null) {
                try {
                    List<Document> vectorDocs = buildVectorDocuments(savedDocument, savedChunks);
                    vectorStore.add(vectorDocs);
                    vectorCount = vectorDocs.size();
                    log.info("Inserted {} vector records into PgVectorStore for document id='{}'", vectorCount, savedDocument.getId());
                } catch (Exception e) {
                    log.error("Failed to insert vector embeddings for document id='{}'", savedDocument.getId(), e);
                    throw new IllegalStateException("Vector store insertion failed for document '" + savedDocument.getTitle() + "': " + e.getMessage(), e);
                }
            } else {
                log.info("PgVectorStore bean not available in current profile; vector insertion skipped for document id='{}'", savedDocument.getId());
            }
        }

        return KnowledgeIngestionResult.builder()
                .documentId(savedDocument.getId())
                .title(savedDocument.getTitle())
                .status(savedDocument.getStatus())
                .chunkCount(savedChunks.size())
                .vectorCount(vectorCount)
                .outcome("SUCCESS")
                .message("Successfully ingested document and generated " + savedChunks.size() + " chunks (" + vectorCount + " vectors inserted).")
                .build();
    }

    private void validateRequest(KnowledgeIngestionRequest request) {
        if (request == null) {
            throw new BadRequestException("Ingestion request cannot be null.");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
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
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new BadRequestException("Document content is required and cannot be blank.");
        }
    }

    private Optional<KnowledgeDocument> findExistingDuplicate(String title, String version, String source) {
        List<KnowledgeDocument> matches = documentRepository.findAll((root, query, cb) -> cb.equal(root.get("title"), title));
        for (KnowledgeDocument doc : matches) {
            if (version != null && version.equalsIgnoreCase(doc.getVersion())) {
                return Optional.of(doc);
            }
            if (version == null && doc.getVersion() == null) {
                if (source == null || source.equalsIgnoreCase(doc.getSource())) {
                    return Optional.of(doc);
                }
            }
        }
        return Optional.empty();
    }

    private void deleteDocumentAndVectors(KnowledgeDocument doc) {
        PgVectorStore vectorStore = vectorStoreProvider.getIfAvailable();
        if (vectorStore != null) {
            try {
                // Delete vectors associated with this document ID from PgVectorStore if present
                vectorStore.delete(List.of(doc.getId().toString()));
            } catch (Exception e) {
                log.warn("Could not delete existing vectors for document id='{}': {}", doc.getId(), e.getMessage());
            }
        }
        documentRepository.delete(doc);
        documentRepository.flush();
    }

    private String buildChunkMetadata(KnowledgeDocument doc, int chunkIndex) {
        return String.format("{\"document_id\": \"%s\", \"chunk_index\": %d, \"topic\": \"%s\"}",
                doc.getId(), chunkIndex, doc.getTopic());
    }

    public List<Document> buildVectorDocuments(KnowledgeDocument doc, List<KnowledgeChunk> chunks) {
        List<Document> vectorDocs = new ArrayList<>();
        for (KnowledgeChunk chunk : chunks) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("knowledgeDocumentId", doc.getId().toString());
            meta.put("knowledgeChunkId", chunk.getId().toString());
            meta.put("chunkIndex", chunk.getChunkIndex());
            meta.put("title", doc.getTitle());
            if (doc.getSource() != null) meta.put("source", doc.getSource());
            meta.put("sourceType", doc.getSourceType().name());
            meta.put("language", doc.getLanguage().name());
            if (doc.getCrop() != null) meta.put("crop", doc.getCrop());
            meta.put("topic", doc.getTopic().name());
            if (doc.getAuthority() != null) meta.put("authority", doc.getAuthority());
            if (doc.getVersion() != null) meta.put("version", doc.getVersion());
            if (doc.getPublishedDate() != null) meta.put("publishedDate", doc.getPublishedDate().toString());
            if (doc.getLastVerifiedAt() != null) meta.put("lastVerifiedAt", doc.getLastVerifiedAt().toString());
            meta.put("status", doc.getStatus().name());

            Document vectorDoc = new Document(chunk.getId().toString(), chunk.getContent(), meta);
            vectorDocs.add(vectorDoc);
        }
        return vectorDocs;
    }
}
