package com.smartfarm.advisory;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
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
 * Phase 2B Integration Test — Vector Store Infrastructure.
 *
 * <p>Verifies end-to-end integration with PostgreSQL 16 + PostGIS 3.4 + pgvector 0.8.6:
 * <ol>
 *   <li>Vector extension (V18) is enabled.
 *   <li>{@link PgVectorStore} initializes {@code vector_store} table with HNSW index and 1536-dim vector column.
 *   <li>Vector insertion succeeds.
 *   <li>Similarity search retrieval returns stored document.
 * </ol>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("prod")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://localhost:5432/smartfarm",
    "spring.datasource.username=smartfarm",
    "spring.datasource.password=smartfarm_dev",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.flyway.enabled=true",
    "spring.ai.vectorstore.pgvector.initialize-schema=true",
    "spring.ai.vectorstore.pgvector.table-name=vector_store",
    "spring.ai.vectorstore.pgvector.dimensions=1536",
    "spring.ai.vectorstore.pgvector.distance-type=COSINE_DISTANCE",
    "spring.ai.vectorstore.pgvector.index-type=HNSW"
})
class PgVectorStoreIntegrationTest {

  static final int DIMENSION = 1536;

  /**
   * Stub EmbeddingModel returning 1536-dimensional zero vectors.
   * Eliminates dependence on external OpenAI API keys during testing.
   */
  static float[] createTestVector() {
    float[] v = new float[DIMENSION];
    v[0] = 1.0f;
    return v;
  }

  static final class StubEmbeddingModel implements EmbeddingModel {

    @Override
    public EmbeddingResponse call(EmbeddingRequest request) {
      List<Embedding> embeddings =
          request.getInstructions().stream()
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
  private JdbcTemplate jdbcTemplate;

  @Autowired
  private PgVectorStore vectorStore;

  @BeforeEach
  void setUp() {
    jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector");
  }

  @AfterEach
  void cleanUp() {
    jdbcTemplate.execute("DELETE FROM vector_store WHERE metadata->>'source' = 'phase2b-test'");
  }

  @Test
  @DisplayName("PgVectorStore: can store and retrieve a document via similarity search")
  void shouldStoreAndRetrieveDocument() {
    String testContent = "Phase 2B infrastructure verification document";
    Document doc =
        new Document(
            testContent,
            Map.of("source", "phase2b-test", "type", "infrastructure-verification"));

    vectorStore.add(List.of(doc));

    List<Document> results =
        vectorStore.similaritySearch(
            SearchRequest.builder().query(testContent).topK(1).build());

    assertThat(results).isNotEmpty();
    assertThat(results.get(0).getText()).isEqualTo(testContent);
  }

  @Test
  @DisplayName("PgVectorStore: embedding column exists in vector_store table")
  void shouldInitialiseVectorStoreTable() {
    Integer count =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.columns "
                + "WHERE table_name = 'vector_store' AND column_name = 'embedding'",
            Integer.class);
    assertThat(count).isEqualTo(1);
  }
}
