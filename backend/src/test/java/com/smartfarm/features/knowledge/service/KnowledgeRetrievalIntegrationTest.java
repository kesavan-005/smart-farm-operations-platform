package com.smartfarm.features.knowledge.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionResult;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.embedding.EmbeddingResultMetadata;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = "logging.level.org.springframework.jdbc.core.JdbcTemplate=TRACE")
@ActiveProfiles("prod")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://localhost:5432/smartfarm",
    "spring.datasource.username=smartfarm",
    "spring.datasource.password=smartfarm_dev",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.flyway.enabled=true",
    "smartfarm.knowledge.ingestion.chunk-size=300",
    "smartfarm.knowledge.ingestion.chunk-overlap=50",
    "spring.ai.vectorstore.pgvector.initialize-schema=true",
    "spring.ai.vectorstore.pgvector.table-name=vector_store",
    "spring.ai.vectorstore.pgvector.dimensions=1536",
    "spring.ai.vectorstore.pgvector.distance-type=COSINE_DISTANCE",
    "spring.ai.vectorstore.pgvector.index-type=HNSW"
})
@DisplayName("Phase 4A-1 - Knowledge Retrieval & PgVectorStore Real Integration Test")
class KnowledgeRetrievalIntegrationTest {

    static final int DIMENSION = 1536;

    static float[] createTestVector() {
        float[] v = new float[DIMENSION];
        v[0] = 1.0f;
        return v;
    }

    static final class StubEmbeddingModel implements EmbeddingModel {
        @Override
        public EmbeddingResponse call(EmbeddingRequest request) {
            List<Embedding> embeddings = request.getInstructions().stream()
                    .map(text -> new Embedding(createTestVector(), 0, EmbeddingResultMetadata.EMPTY))
                    .toList();
            return new EmbeddingResponse(embeddings);
        }

        @Override
        public float[] embed(Document document) {
            return createTestVector();
        }

        @Override
        public int dimensions() {
            return DIMENSION;
        }
    }

    @TestConfiguration
    static class TestEmbeddingConfig {
        @Bean
        @Primary
        EmbeddingModel stubEmbeddingModel() {
            return new StubEmbeddingModel();
        }

        @Bean
        @Primary
        ChatModel stubChatModel() {
            return new ChatModel() {
                @Override
                public ChatResponse call(Prompt prompt) {
                    return null;
                }
            };
        }
    }

    @Autowired
    private KnowledgeIngestionService ingestionService;

    @Autowired
    private KnowledgeRetrievalService retrievalService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private org.springframework.ai.vectorstore.pgvector.PgVectorStore pgVectorStore;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector");
    }

    @AfterEach
    void cleanUp() {
        jdbcTemplate.execute("DELETE FROM vector_store WHERE metadata->>'title' LIKE 'Retrieval Test%'");
        jdbcTemplate.execute("DELETE FROM knowledge_chunks WHERE metadata->>'title' LIKE 'Retrieval Test%'");
        jdbcTemplate.execute("DELETE FROM knowledge_documents WHERE title LIKE 'Retrieval Test%'");
    }

    @Test
    @DisplayName("End-to-End Retrieval: Query -> PgVectorStore -> Result Mapping and Score Semantics")
    void testRetrievalAndScoreSemantics() {
        // 1. Ingest test data
        String content = "Retrieval Test Paragraph: Organic pest management using neem oil.";
        KnowledgeIngestionRequest req = KnowledgeIngestionRequest.builder()
                .title("Retrieval Test Neem Guide")
                .source("Organic Board")
                .sourceType(SourceType.GOVERNMENT)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Generic")
                .topic(KnowledgeTopic.PEST_MANAGEMENT)
                .authority("Ministry of Agriculture")
                .version("v1")
                .publishedDate(LocalDate.of(2024, 1, 1))
                .status(DocumentStatus.ACTIVE)
                .content(content)
                .build();

        KnowledgeIngestionResult ingestionResult = ingestionService.ingestDocument(req);
        assertThat(ingestionResult.getOutcome()).isEqualTo("SUCCESS");

        // 2. Perform Retrieval
        KnowledgeRetrievalRequest retrievalReq = KnowledgeRetrievalRequest.builder()
                .query("pest management")
                .topK(5)
                .build();

        List<KnowledgeRetrievalResult> results = retrievalService.search(retrievalReq);

        // 3. Verify Results
        assertThat(results).isNotEmpty();
        
        // Find our specific ingested document in the results
        KnowledgeRetrievalResult match = results.stream()
                .filter(r -> "Retrieval Test Neem Guide".equals(r.getTitle()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Ingested document not found in retrieval results"));

        // Verify topK bounds
        assertThat(results.size()).isLessThanOrEqualTo(5);

        // Verify Metadata preservation
        assertThat(match.getKnowledgeDocumentId()).isEqualTo(ingestionResult.getDocumentId().toString());
        assertThat(match.getKnowledgeChunkId()).isNotNull();
        assertThat(match.getChunkIndex()).isEqualTo(0);
        assertThat(match.getTitle()).isEqualTo("Retrieval Test Neem Guide");
        assertThat(match.getSource()).isEqualTo("Organic Board");
        assertThat(match.getSourceType()).isEqualTo("GOVERNMENT");
        assertThat(match.getLanguage()).isEqualTo("ENGLISH");
        assertThat(match.getCrop()).isEqualTo("Generic");
        assertThat(match.getTopic()).isEqualTo("PEST_MANAGEMENT");
        assertThat(match.getAuthority()).isEqualTo("Ministry of Agriculture");
        assertThat(match.getVersion()).isEqualTo("v1");
        assertThat(match.getPublishedDate()).isEqualTo("2024-01-01");
        assertThat(match.getContent()).contains("Organic pest management");

        // 4. Verify Score Semantics
        assertThat(match.getScore()).isNotNull();
        
        // Ensure result ordering is sorted by score (ascending or descending depending on distance vs similarity)
        // Spring AI PgVectorStore uses COSINE_DISTANCE by default in application.yml.
        // Smaller distance means greater relevance.
        // Let's verify the list is ordered.
        if (results.size() > 1) {
            Double firstScore = results.get(0).getScore();
            Double secondScore = results.get(1).getScore();
            // In pgvector with COSINE_DISTANCE, smaller is more similar.
            assertThat(firstScore).isLessThanOrEqualTo(secondScore);
            System.out.println("Score Semantics Verified: Smaller score means greater relevance (Cosine Distance). First=" + firstScore + ", Second=" + secondScore);
        }
    }

    @Test
    @DisplayName("Metadata Filtering and Status ACTIVE Enforcement")
    void testMetadataFilteringAndStatusEnforcement() {
        // Doc 1: ACTIVE, Paddy, PEST_MANAGEMENT
        ingestionService.ingestDocument(KnowledgeIngestionRequest.builder()
                .title("Retrieval Test Active Paddy")
                .source("Test")
                .sourceType(SourceType.OTHER)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Paddy")
                .topic(KnowledgeTopic.PEST_MANAGEMENT)
                .status(DocumentStatus.ACTIVE)
                .content("Content 1")
                .build());

        // Doc 2: ACTIVE, Wheat, PEST_MANAGEMENT
        ingestionService.ingestDocument(KnowledgeIngestionRequest.builder()
                .title("Retrieval Test Active Wheat")
                .source("Test")
                .sourceType(SourceType.OTHER)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Wheat")
                .topic(KnowledgeTopic.PEST_MANAGEMENT)
                .status(DocumentStatus.ACTIVE)
                .content("Content 2")
                .build());

        // Doc 3: INACTIVE, Paddy, PEST_MANAGEMENT
        ingestionService.ingestDocument(KnowledgeIngestionRequest.builder()
                .title("Retrieval Test Inactive Paddy")
                .source("Test")
                .sourceType(SourceType.OTHER)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Paddy")
                .topic(KnowledgeTopic.PEST_MANAGEMENT)
                .status(DocumentStatus.RETIRED)
                .content("Content 3")
                .build());

        // Query with crop = Paddy
        KnowledgeRetrievalRequest req = KnowledgeRetrievalRequest.builder()
                .query("dummy")
                .topK(5)
                .crop("Paddy")
                .build();

        List<KnowledgeRetrievalResult> results = retrievalService.search(req);

        // Since embeddings are identical (distance=0), only metadata filters differentiate them.
        // Expect ONLY Doc 1. Doc 2 is Wheat, Doc 3 is INACTIVE.
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("Retrieval Test Active Paddy");
        
        // Query with topic = DISEASE_MANAGEMENT (None match)
        KnowledgeRetrievalRequest reqTopic = KnowledgeRetrievalRequest.builder()
                .query("dummy")
                .topK(5)
                .topic(KnowledgeTopic.DISEASE_MANAGEMENT)
                .build();

        List<KnowledgeRetrievalResult> resultsTopic = retrievalService.search(reqTopic);
        assertThat(resultsTopic).isEmpty();
    }

    @Test
    void verifyPgVectorStoreIsWired() {
        // Just verify context starts up correctly with the store
        org.junit.jupiter.api.Assertions.assertNotNull(pgVectorStore);
    }
}
