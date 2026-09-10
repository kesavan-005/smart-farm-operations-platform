package com.smartfarm.config;

import javax.sql.DataSource;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Phase 2B — Vector Store Infrastructure.
 *
 * <p>Configures Spring AI's {@link PgVectorStore} against the existing Smart FARM PostgreSQL
 * database. The vector extension was enabled in V18__Add_vector_extension.sql.
 *
 * <p>Scope: infrastructure only. No document ingestion, chunking, retrieval, or RAG services are
 * defined here.
 *
 * <p>Active only in the {@code prod} profile so that the dev/H2 profile remains unaffected.
 */
@Configuration
@Profile({"prod", "dev"})
public class VectorStoreConfig {

  @Value("${spring.ai.vectorstore.pgvector.dimensions:384}")
  private int embeddingDimension;

  @Value("${spring.ai.vectorstore.pgvector.distance-type:COSINE_DISTANCE}")
  private String distanceType;

  @Value("${spring.ai.vectorstore.pgvector.initialize-schema:true}")
  private boolean initializeSchema;

  @Value("${spring.ai.vectorstore.pgvector.table-name:vector_store}")
  private String tableName;

  /**
   * Creates a {@link PgVectorStore} bean that reuses the existing application {@link DataSource}.
   *
   * <p>No separate datasource is created. The vector_store table is auto-initialised by Spring AI
   * on first startup (controlled by {@code initialize-schema}).
   *
   * @param jdbcTemplate autowired from the existing datasource bean
   * @param embeddingModel the configured {@link EmbeddingModel}
   * @return a configured {@link PgVectorStore}
   */
  @Bean
  public PgVectorStore vectorStore(JdbcTemplate jdbcTemplate, EmbeddingModel embeddingModel) {
    return PgVectorStore.builder(jdbcTemplate, embeddingModel)
        .dimensions(embeddingDimension)
        .distanceType(PgVectorStore.PgDistanceType.valueOf(distanceType))
        .initializeSchema(initializeSchema)
        .vectorTableName(tableName)
        .build();
  }
}
