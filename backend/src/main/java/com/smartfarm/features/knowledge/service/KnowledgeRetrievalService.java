package com.smartfarm.features.knowledge.service;

import com.smartfarm.common.exception.BadRequestException;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Phase 4A-1: Semantic Knowledge Retrieval Service.
 * Retrieves knowledge chunks from PgVectorStore based on semantic similarity.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeRetrievalService {

    // Using ObjectProvider because PgVectorStore is conditionally loaded in 'prod' profile via VectorStoreConfig.
    // Direct injection would cause application context failures in non-prod profiles.
    private final ObjectProvider<PgVectorStore> vectorStoreProvider;

    @org.springframework.beans.factory.annotation.Value("${smartfarm.knowledge.retrieval.max-distance:0.50}")
    private double maxDistance;

    /**
     * Performs a semantic similarity search against the vector database.
     *
     * @param request The search request containing the query and topK.
     * @return A list of KnowledgeRetrievalResult containing the content, score, and metadata.
     */
    public List<KnowledgeRetrievalResult> search(KnowledgeRetrievalRequest request) {
        if (request == null) {
            throw new BadRequestException("Request cannot be null");
        }
        if (request.getQuery() == null || request.getQuery().trim().isEmpty()) {
            throw new BadRequestException("Query cannot be blank");
        }
        if (request.getTopK() <= 0) {
            throw new BadRequestException("topK must be greater than 0");
        }

        PgVectorStore vectorStore = vectorStoreProvider.getIfAvailable();
        if (vectorStore == null) {
            log.warn("PgVectorStore is not available in the current context. Returning empty results.");
            return Collections.emptyList();
        }

        log.debug("Executing similarity search for query: '{}', topK: {}", request.getQuery(), request.getTopK());

        org.springframework.ai.vectorstore.filter.FilterExpressionBuilder b = new org.springframework.ai.vectorstore.filter.FilterExpressionBuilder();
        org.springframework.ai.vectorstore.filter.FilterExpressionBuilder.Op op = b.eq("status", "ACTIVE");

        if (request.getCrop() != null && !request.getCrop().trim().isEmpty()) {
            op = b.and(op, b.eq("crop", request.getCrop().trim()));
        }
        if (request.getTopic() != null) {
            op = b.and(op, b.eq("topic", request.getTopic().name()));
        }
        if (request.getLanguage() != null) {
            op = b.and(op, b.eq("language", request.getLanguage().name()));
        }

        // Spring AI 1.0.x SearchRequest builder
        SearchRequest searchRequest = SearchRequest.builder()
                .query(request.getQuery())
                .topK(request.getTopK())
                .similarityThreshold(maxDistance)
                .filterExpression(op.build())
                .build();

        List<Document> documents = vectorStore.similaritySearch(searchRequest);

        log.debug("Found {} documents for query: '{}'", documents.size(), request.getQuery());

        return documents.stream()
                .map(this::mapToResult)
                .collect(Collectors.toList());
    }

    private KnowledgeRetrievalResult mapToResult(Document document) {
        Map<String, Object> metadata = document.getMetadata();
        
        Double score = document.getScore();

        return KnowledgeRetrievalResult.builder()
                .content(document.getText())
                .score(score)
                .knowledgeDocumentId(getStringOrNull(metadata, "knowledgeDocumentId"))
                .knowledgeChunkId(getStringOrNull(metadata, "knowledgeChunkId"))
                .chunkIndex(getIntegerOrNull(metadata, "chunkIndex"))
                .title(getStringOrNull(metadata, "title"))
                .source(getStringOrNull(metadata, "source"))
                .sourceType(getStringOrNull(metadata, "sourceType"))
                .language(getStringOrNull(metadata, "language"))
                .crop(getStringOrNull(metadata, "crop"))
                .topic(getStringOrNull(metadata, "topic"))
                .authority(getStringOrNull(metadata, "authority"))
                .version(getStringOrNull(metadata, "version"))
                .publishedDate(getStringOrNull(metadata, "publishedDate"))
                .lastVerifiedAt(getStringOrNull(metadata, "lastVerifiedAt"))
                .build();
    }

    private String getStringOrNull(Map<String, Object> metadata, String key) {
        Object val = metadata.get(key);
        return val != null ? val.toString() : null;
    }

    private Integer getIntegerOrNull(Map<String, Object> metadata, String key) {
        Object val = metadata.get(key);
        if (val instanceof Number) {
            return ((Number) val).intValue();
        } else if (val instanceof String) {
            try {
                return Integer.parseInt((String) val);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
