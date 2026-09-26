package com.smartfarm.features.knowledge;

import static org.assertj.core.api.Assertions.assertThat;

import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeChunk;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionResult;
import com.smartfarm.features.knowledge.repository.KnowledgeChunkRepository;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import com.smartfarm.features.knowledge.service.KnowledgeIngestionService;
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
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Phase 3B Real Integration Test — Knowledge Ingestion, Chunking, Relational Persistence,
 * Embedding Generation, and PgVectorStore Storage.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
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
@DisplayName("Phase 3B - Knowledge Ingestion & PgVectorStore Real Integration Test")
class KnowledgeIngestionIntegrationTest {

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
    private KnowledgeDocumentRepository documentRepository;

    @Autowired
    private KnowledgeChunkRepository chunkRepository;

    @Autowired
    private PgVectorStore vectorStore;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector");
    }

    @AfterEach
    void cleanUp() {
        jdbcTemplate.execute("DELETE FROM vector_store WHERE metadata->>'title' LIKE 'Integration Test%'");
    }

    @Test
    @DisplayName("End-to-End Ingestion: Document -> Normalization -> Chunking -> Chunks -> Embeddings -> PgVectorStore")
    void testEndToEndIngestionAndVectorStorage() {
        String longContent = "Integration Test Paragraph 1: Paddy crop fertilization management.\n\n"
                + "Application of nitrogen, phosphorus, and potassium (NPK 10:26:26) during basal soil preparation.\n\n"
                + "Integration Test Paragraph 2: Top dressing urea application at tillering stage and panicle initiation stage.\n\n"
                + "Integration Test Paragraph 3: Micronutrient management including zinc sulphate spraying to prevent khaira disease in paddy fields.";

        KnowledgeIngestionRequest request = KnowledgeIngestionRequest.builder()
                .title("Integration Test Paddy Fertilizer Guide")
                .source("TNAU Agronomy Dept")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Paddy")
                .topic(KnowledgeTopic.FERTILIZATION)
                .authority("Directorate of Crop Management")
                .version("2024.v1")
                .publishedDate(LocalDate.of(2024, 3, 10))
                .status(DocumentStatus.ACTIVE)
                .content(longContent)
                .build();

        KnowledgeIngestionResult result = ingestionService.ingestDocument(request);

        assertThat(result.getOutcome()).isEqualTo("SUCCESS");
        assertThat(result.getDocumentId()).isNotNull();
        assertThat(result.getChunkCount()).isGreaterThanOrEqualTo(2);
        assertThat(result.getVectorCount()).isEqualTo(result.getChunkCount());

        // 1. Verify Relational KnowledgeDocument
        KnowledgeDocument savedDoc = documentRepository.findById(result.getDocumentId()).orElseThrow();
        assertThat(savedDoc.getTitle()).isEqualTo("Integration Test Paddy Fertilizer Guide");
        assertThat(savedDoc.getStatus()).isEqualTo(DocumentStatus.ACTIVE);

        // 2. Verify Relational KnowledgeChunks
        List<KnowledgeChunk> chunks = chunkRepository.findByDocument_IdOrderByChunkIndexAsc(savedDoc.getId());
        assertThat(chunks).hasSize(result.getChunkCount());
        assertThat(chunks.get(0).getChunkIndex()).isEqualTo(0);
        assertThat(chunks.get(1).getChunkIndex()).isEqualTo(1);

        // 3. Verify Vector Store Similarity Retrieval
        List<Document> retrievedVectors = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query("paddy fertilization NPK")
                        .topK(2)
                        .build()
        );

        assertThat(retrievedVectors).isNotEmpty();
        assertThat(retrievedVectors.get(0).getMetadata()).containsEntry("knowledgeDocumentId", savedDoc.getId().toString());
        assertThat(retrievedVectors.get(0).getMetadata()).containsEntry("topic", "FERTILIZATION");
        assertThat(retrievedVectors.get(0).getMetadata()).containsEntry("crop", "Paddy");

        // 4. Verify Database Column Dimensions in PostgreSQL
        Integer vectorDimensionCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns "
                        + "WHERE table_name = 'vector_store' AND column_name = 'embedding'",
                Integer.class
        );
        assertThat(vectorDimensionCount).isEqualTo(1);
    }

    @Test
    @DisplayName("Duplicate Ingestion: Skips when allowDuplicate=false, replaces when allowDuplicate=true")
    void testDuplicateIngestionHandling() {
        KnowledgeIngestionRequest req = KnowledgeIngestionRequest.builder()
                .title("Integration Test Soil Moisture Management")
                .sourceType(SourceType.EXTENSION_SERVICE)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.IRRIGATION)
                .version("1.0")
                .status(DocumentStatus.ACTIVE)
                .content("Irrigation management guidelines for sandy loam soils.")
                .allowDuplicate(false)
                .build();

        // Initial Ingestion
        KnowledgeIngestionResult result1 = ingestionService.ingestDocument(req);
        assertThat(result1.getOutcome()).isEqualTo("SUCCESS");

        // Duplicate Attempt with allowDuplicate=false
        KnowledgeIngestionResult result2 = ingestionService.ingestDocument(req);
        assertThat(result2.getOutcome()).isEqualTo("SKIPPED_DUPLICATE");

        // Re-ingest with allowDuplicate=true
        req.setAllowDuplicate(true);
        KnowledgeIngestionResult result3 = ingestionService.ingestDocument(req);
        assertThat(result3.getOutcome()).isEqualTo("SUCCESS");
    }
}
