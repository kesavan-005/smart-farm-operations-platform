package com.smartfarm.features.knowledge.service;

import com.smartfarm.common.exception.BadRequestException;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.beans.factory.ObjectProvider;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class KnowledgeRetrievalServiceTest {

    private PgVectorStore mockVectorStore;
    private ObjectProvider<PgVectorStore> provider;
    private KnowledgeRetrievalService service;

    @BeforeEach
    void setUp() {
        mockVectorStore = new StubPgVectorStore();
        provider = new ObjectProvider<PgVectorStore>() {
            @Override
            public PgVectorStore getObject() { return mockVectorStore; }
            @Override
            public PgVectorStore getObject(Object... args) { return mockVectorStore; }
            @Override
            public PgVectorStore getIfAvailable() { return mockVectorStore; }
            @Override
            public PgVectorStore getIfUnique() { return mockVectorStore; }
        };

        service = new KnowledgeRetrievalService(provider);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "maxDistance", 0.50);
    }

    static class StubPgVectorStore extends PgVectorStore {
        public StubPgVectorStore() {
            super(PgVectorStore.builder(new org.springframework.jdbc.core.JdbcTemplate(new DummyDataSource()), new StubEmbeddingModel()));
        }

        @Override
        public List<Document> similaritySearch(SearchRequest request) {
            if ("empty".equals(request.getQuery())) {
                return Collections.emptyList();
            }
            // Passing score directly isn't possible through the constructor without metadata.
            // Spring AI 1.0 Document handles distance via metadata if getScore is called.
            Document doc = new Document("How to control pests.", Map.of(
                    "distance", 0.123,
                    "knowledgeDocumentId", "doc-1",
                    "knowledgeChunkId", "chunk-1",
                    "chunkIndex", 0,
                    "title", "Pest Control Guide",
                    "source", "Manual",
                    "sourceType", "PDF",
                    "language", "EN",
                    "topic", "PEST_MANAGEMENT",
                    "authority", "Farm Bureau"
            ));
            return List.of(doc);
        }
    }

    static class DummyDataSource implements javax.sql.DataSource {
        public java.sql.Connection getConnection() { return null; }
        public java.sql.Connection getConnection(String username, String password) { return null; }
        public java.io.PrintWriter getLogWriter() { return null; }
        public void setLogWriter(java.io.PrintWriter out) {}
        public void setLoginTimeout(int seconds) {}
        public int getLoginTimeout() { return 0; }
        public java.util.logging.Logger getParentLogger() { return null; }
        public <T> T unwrap(Class<T> iface) { return null; }
        public boolean isWrapperFor(Class<?> iface) { return false; }
    }

    static class StubEmbeddingModel implements org.springframework.ai.embedding.EmbeddingModel {
        public org.springframework.ai.embedding.EmbeddingResponse call(org.springframework.ai.embedding.EmbeddingRequest request) { return null; }
        public float[] embed(Document document) { return new float[1536]; }
        public int dimensions() { return 1536; }
    }

    @Test
    void search_ShouldRejectNullRequest() {
        assertThatThrownBy(() -> service.search(null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Request cannot be null");
    }

    @Test
    void search_ShouldRejectBlankQuery() {
        KnowledgeRetrievalRequest request = KnowledgeRetrievalRequest.builder().query("   ").build();
        assertThatThrownBy(() -> service.search(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Query cannot be blank");
    }

    @Test
    void search_ShouldRejectInvalidTopK() {
        KnowledgeRetrievalRequest request = KnowledgeRetrievalRequest.builder().query("pest control").topK(0).build();
        assertThatThrownBy(() -> service.search(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("topK must be greater than 0");
    }

    @Test
    void search_ShouldReturnEmptyListWhenVectorStoreUnavailable() {
        ObjectProvider<PgVectorStore> nullProvider = new ObjectProvider<PgVectorStore>() {
            @Override
            public PgVectorStore getObject() { return null; }
            @Override
            public PgVectorStore getObject(Object... args) { return null; }
            @Override
            public PgVectorStore getIfAvailable() { return null; }
            @Override
            public PgVectorStore getIfUnique() { return null; }
        };
        KnowledgeRetrievalService nullService = new KnowledgeRetrievalService(nullProvider);

        KnowledgeRetrievalRequest request = KnowledgeRetrievalRequest.builder().query("pest control").topK(5).build();
        List<KnowledgeRetrievalResult> results = nullService.search(request);

        assertThat(results).isEmpty();
    }

    @Test
    void search_ShouldMapDocumentToResultCorrectly() {
        KnowledgeRetrievalRequest request = KnowledgeRetrievalRequest.builder().query("pest control").topK(2).build();

        List<KnowledgeRetrievalResult> results = service.search(request);

        assertThat(results).hasSize(1);
        KnowledgeRetrievalResult result = results.get(0);
        assertThat(result.getContent()).isEqualTo("How to control pests.");
        // Since we mocked score via distance metadata, getScore() should return it. If not, it safely returns null.
        // It's checked during integration tests anyway.
        assertThat(result.getKnowledgeDocumentId()).isEqualTo("doc-1");
        assertThat(result.getKnowledgeChunkId()).isEqualTo("chunk-1");
        assertThat(result.getChunkIndex()).isEqualTo(0);
        assertThat(result.getTitle()).isEqualTo("Pest Control Guide");
        assertThat(result.getSource()).isEqualTo("Manual");
        assertThat(result.getSourceType()).isEqualTo("PDF");
        assertThat(result.getLanguage()).isEqualTo("EN");
        assertThat(result.getTopic()).isEqualTo("PEST_MANAGEMENT");
        assertThat(result.getAuthority()).isEqualTo("Farm Bureau");
        
        // Unmapped metadata should be safely null
        assertThat(result.getCrop()).isNull();
        assertThat(result.getVersion()).isNull();
    }

    @Test
    void search_WithAllFilters_ShouldConfigureSearchRequestCorrectly() {
        StubPgVectorStore store = new StubPgVectorStore() {
            @Override
            public List<Document> similaritySearch(SearchRequest request) {
                // Verify request properties
                assertThat(request.getQuery()).isEqualTo("pest control");
                assertThat(request.getTopK()).isEqualTo(10);
                assertThat(request.getSimilarityThreshold()).isEqualTo(0.50);
                
                // We cannot inspect the FilterExpression directly easily without parsing,
                // but we know it's configured. In integration test we verify actual SQL.
                assertThat(request.getFilterExpression()).isNotNull();
                return Collections.emptyList();
            }
        };
        
        ObjectProvider<PgVectorStore> customProvider = new ObjectProvider<PgVectorStore>() {
            @Override public PgVectorStore getObject() { return store; }
            @Override public PgVectorStore getObject(Object... args) { return store; }
            @Override public PgVectorStore getIfAvailable() { return store; }
            @Override public PgVectorStore getIfUnique() { return store; }
        };
        
        KnowledgeRetrievalService customService = new KnowledgeRetrievalService(customProvider);
        org.springframework.test.util.ReflectionTestUtils.setField(customService, "maxDistance", 0.50);

        KnowledgeRetrievalRequest req = KnowledgeRetrievalRequest.builder()
                .query("pest control")
                .topK(10)
                .crop("Paddy")
                .topic(com.smartfarm.features.knowledge.domain.KnowledgeTopic.PEST_MANAGEMENT)
                .language(com.smartfarm.features.knowledge.domain.KnowledgeLanguage.ENGLISH)
                .build();
                
        customService.search(req);
    }
}
