package com.smartfarm.features.advisory.evaluation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.smartfarm.features.advisory.dto.AdvisoryRequest;
import com.smartfarm.features.advisory.dto.AdvisoryResponse;
import com.smartfarm.features.advisory.service.AdvisoryOrchestrationService;
import com.smartfarm.features.farm.dto.context.FarmContextResponse;
import com.smartfarm.features.farm.service.FarmContextService;
import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import com.smartfarm.features.knowledge.service.KnowledgeIngestionService;
import com.smartfarm.features.knowledge.service.KnowledgeRetrievalService;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.embedding.EmbeddingResultMetadata;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import com.smartfarm.features.farm.dto.context.FarmProfile;
import com.smartfarm.features.advisory.dto.AdvisoryContext;
import com.smartfarm.features.advisory.service.ContextAssembler;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("prod")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://localhost:5432/smartfarm",
    "spring.datasource.username=smartfarm",
    "spring.datasource.password=smartfarm_dev",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.flyway.enabled=true",
    "smartfarm.knowledge.ingestion.chunk-size=500",
    "smartfarm.knowledge.ingestion.chunk-overlap=0",
    "spring.ai.vectorstore.pgvector.initialize-schema=true",
    "spring.ai.vectorstore.pgvector.table-name=vector_store",
    "spring.ai.vectorstore.pgvector.dimensions=1536",
    "spring.ai.vectorstore.pgvector.distance-type=COSINE_DISTANCE",
    "spring.ai.vectorstore.pgvector.index-type=HNSW",
    // We set max-distance to a known threshold to evaluate if the system uses it correctly
    "smartfarm.knowledge.retrieval.max-distance=0.4"
})
@DisplayName("Phase 7A - RAG Evaluation Integration Test")
class RagEvaluationIntegrationTest {

    // For evaluation, we use 1536 dimensions to match the DB schema, but only mathematically craft the first 3.
    static final int DIM = 1536;

    static float[] createVector(float v0, float v1, float v2) {
        float[] v = new float[DIM];
        v[0] = v0; v[1] = v1; v[2] = v2;
        return v;
    }

    // Vectors
    static final float[] V_PADDY = createVector(1.0f, 0.0f, 0.0f); // Paddy concepts
    static final float[] V_WHEAT = createVector(0.0f, 1.0f, 0.0f); // Wheat concepts
    static final float[] V_MIXED = createVector(0.7071f, 0.7071f, 0.0f); // Mixed / Intermediate distance
    static final float[] V_IRRELEVANT = createVector(0.0f, 0.0f, 1.0f); // Completely orthogonal concepts

    // Custom Embedding Model that maps specific texts to deterministic vectors
    static final class DeterministicEmbeddingModel implements EmbeddingModel {
        @Override
        public EmbeddingResponse call(EmbeddingRequest request) {
            List<Embedding> embeddings = request.getInstructions().stream()
                    .map(text -> new Embedding(embed(new Document(text)), 0, EmbeddingResultMetadata.EMPTY))
                    .toList();
            return new EmbeddingResponse(embeddings);
        }

        @Override
        public float[] embed(Document document) {
            String text = document.getText().toLowerCase();
            if (text.contains("mixed") || text.contains("both")) return V_MIXED;
            if (text.contains("paddy") || text.contains("rice") || text.contains("நெல்")) return V_PADDY;
            if (text.contains("wheat")) return V_WHEAT;
            return V_IRRELEVANT;
        }

        @Override
        public int dimensions() {
            return DIM;
        }
    }

    // Custom Chat Model to evaluate Groundedness
    static final class MockChatModel implements ChatModel {
        @Override
        public ChatResponse call(Prompt prompt) {
            String content = prompt.getContents();
            // If the prompt contains our expected knowledge, we reply "SUPPORTED", else "UNSUPPORTED"
            if (content.contains("Expected Paddy Knowledge")) {
                return new ChatResponse(List.of(new Generation(new org.springframework.ai.chat.messages.AssistantMessage("Grounded response based on paddy knowledge."))));
            }
            return new ChatResponse(List.of(new Generation(new org.springframework.ai.chat.messages.AssistantMessage("Unsupported fabricated response."))));
        }

        @Override
        public ChatOptions getDefaultOptions() {
            return null;
        }
    }

    @TestConfiguration
    static class RagEvalConfig {
        @Bean
        @Primary
        EmbeddingModel deterministicEmbeddingModel() {
            return new DeterministicEmbeddingModel();
        }

        @Bean
        @Primary
        ChatModel mockChatModel() {
            return new MockChatModel();
        }
        
        @Bean
        @Primary
        ContextAssembler testContextAssembler(KnowledgeRetrievalService retrievalService) {
            return new ContextAssembler(null, retrievalService) {
                @Override
                public AdvisoryContext assemble(AdvisoryRequest request, UUID userId) {
                    FarmContextResponse mockContext = FarmContextResponse.builder()
                        .farmProfile(FarmProfile.builder().name("Evaluation Farm").build())
                        .fields(new ArrayList<>())
                        .cropStates(new ArrayList<>())
                        .build();
                    
                    KnowledgeRetrievalRequest retrievalRequest = KnowledgeRetrievalRequest.builder()
                        .query(request.getQuestion())
                        .topK(5)
                        .build();
                    
                    return AdvisoryContext.builder()
                        .question(request.getQuestion())
                        .farmContext(mockContext)
                        .retrievedKnowledge(retrievalService.search(retrievalRequest))
                        .build();
                }
            };
        }
    }

    @Autowired
    private KnowledgeIngestionService ingestionService;

    @Autowired
    private KnowledgeRetrievalService retrievalService;

    @Autowired
    private AdvisoryOrchestrationService orchestrationService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        // Clear previous data
        jdbcTemplate.execute("DELETE FROM vector_store");
        jdbcTemplate.execute("DELETE FROM knowledge_chunks");
        jdbcTemplate.execute("DELETE FROM knowledge_documents");

        jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector");
        // Clear previous eval data
        jdbcTemplate.execute("DELETE FROM vector_store WHERE metadata->>'title' LIKE 'Eval%'");
        jdbcTemplate.execute("DELETE FROM knowledge_chunks WHERE document_id IN (SELECT id FROM knowledge_documents WHERE title LIKE 'Eval%')");
        jdbcTemplate.execute("DELETE FROM knowledge_documents WHERE title LIKE 'Eval%'");
        
        // Setup Knowledge Corpus
        
        // 1. Highly relevant Paddy document (ACTIVE)
        ingest("Eval Paddy Doc 1", "Paddy irrigation requires standing water. Expected Paddy Knowledge.", 
                "Paddy", KnowledgeTopic.IRRIGATION, KnowledgeLanguage.ENGLISH, DocumentStatus.ACTIVE);
        
        // 2. Wheat document (ACTIVE)
        ingest("Eval Wheat Doc 1", "Wheat fertilization requires NPK.", 
                "Wheat", KnowledgeTopic.FERTILIZATION, KnowledgeLanguage.ENGLISH, DocumentStatus.ACTIVE);
                
        // 3. Mixed / Partially relevant document (ACTIVE)
        ingest("Eval Mixed Doc", "Both paddy and wheat can be grown in rotation.", 
                "Mixed", KnowledgeTopic.DISEASE_MANAGEMENT, KnowledgeLanguage.ENGLISH, DocumentStatus.ACTIVE);

        // 4. Tamil Paddy document (ACTIVE)
        ingest("Eval Paddy Tamil", "நெல் சாகுபடி (Paddy Tamil)", 
                "Paddy", KnowledgeTopic.GENERAL_FARMING, KnowledgeLanguage.TAMIL, DocumentStatus.ACTIVE);
                
        // 5. Inactive Paddy document (DRAFT) - should not be retrieved
        ingest("Eval Draft Paddy", "Secret upcoming paddy guidelines.", 
                "Paddy", KnowledgeTopic.IRRIGATION, KnowledgeLanguage.ENGLISH, DocumentStatus.DRAFT);
    }

    @AfterEach
    void cleanUp() {
        jdbcTemplate.execute("DELETE FROM vector_store WHERE metadata->>'title' LIKE 'Eval%'");
        jdbcTemplate.execute("DELETE FROM knowledge_chunks WHERE document_id IN (SELECT id FROM knowledge_documents WHERE title LIKE 'Eval%')");
        jdbcTemplate.execute("DELETE FROM knowledge_documents WHERE title LIKE 'Eval%'");
    }

    private void ingest(String title, String content, String crop, KnowledgeTopic topic, KnowledgeLanguage language, DocumentStatus status) {
        KnowledgeIngestionRequest req = KnowledgeIngestionRequest.builder()
                .title(title)
                .content(content)
                .crop(crop)
                .topic(topic)
                .language(language)
                .status(status)
                .sourceType(SourceType.EXTENSION_SERVICE)
                .build();
        ingestionService.ingestDocument(req);
    }

    @Test
    @DisplayName("Step 2 & 3: Hit@K and Top-K Ranking")
    void testRetrievalTopK() {
        // Querying for paddy (exact match to V_PADDY)
        KnowledgeRetrievalRequest req = new KnowledgeRetrievalRequest("paddy query", 3, null, null, null);
        List<KnowledgeRetrievalResult> results = retrievalService.search(req);
        
        // Should find Paddy Doc 1 and Paddy Tamil (distance 0) and Mixed (distance ~0.293)
        // Distance Threshold = 0.4
        // All three are < 0.4, topK = 3, so all three should return.
        assertThat(results).hasSize(3);
        
        for (int i=0; i<results.size(); i++) {
            String title = results.get(i).getTitle();
            Double score = results.get(i).getScore();
            String vec = jdbcTemplate.queryForObject("SELECT embedding FROM vector_store WHERE metadata->>'title' = '" + title + "' LIMIT 1", String.class);
            System.out.println("RESULT " + i + ": Title=" + title + ", Score=" + score + ", Vec=" + vec.substring(0, Math.min(vec.length(), 50)) + "...");
        }
        
        // Assert Ordering
        // Distance 0 should be before distance 0.293
        // In Spring AI PgVectorStore, score is usually similarity (1.0 = exact match)
        assertThat(results.get(0).getScore()).isGreaterThan(0.99); // 1.0
        assertThat(results.get(1).getScore()).isGreaterThan(0.99); // 1.0
        assertThat(results.get(2).getTitle()).contains("Mixed");
        assertThat(results.get(2).getScore()).isBetween(0.6, 0.9); // ~0.853 or 0.707
        
        // Assert Source Traceability (Step 8)
        KnowledgeRetrievalResult topHit = results.get(0);
        assertThat(topHit.getKnowledgeDocumentId()).isNotNull();
        assertThat(topHit.getKnowledgeChunkId()).isNotNull();
        assertThat(topHit.getTitle()).contains("Eval Paddy");
        assertThat(topHit.getCrop()).isEqualTo("Paddy");
    }

    @Test
    @DisplayName("Step 4: Metadata Filters (AND Semantics)")
    void testMetadataFilters() {
        KnowledgeRetrievalRequest req = new KnowledgeRetrievalRequest("paddy", 5, "Paddy", KnowledgeTopic.IRRIGATION, KnowledgeLanguage.ENGLISH);
        List<KnowledgeRetrievalResult> results = retrievalService.search(req);
        
        // Must strictly only return Eval Paddy Doc 1.
        // - Paddy Tamil fails Language/Topic.
        // - Draft Paddy fails Status.
        // - Mixed fails Crop/Topic.
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("Eval Paddy Doc 1");
    }

    @Test
    @DisplayName("Step 5: ACTIVE Status Validation")
    void testActiveStatusFilter() {
        KnowledgeRetrievalRequest req = new KnowledgeRetrievalRequest("paddy", 5, null, null, null);
        List<KnowledgeRetrievalResult> results = retrievalService.search(req);
        
        // Ensure "Eval Draft Paddy" is NEVER returned
        boolean containsDraft = results.stream().anyMatch(r -> r.getTitle().contains("Draft"));
        assertThat(containsDraft).isFalse();
    }

    @Test
    @DisplayName("Step 6: Similarity Threshold Validation")
    void testSimilarityThreshold() {
        // Threshold is 0.4.
        // V_WHEAT distance from V_PADDY is 1.0 (cosine dist).
        // It should be excluded entirely.
        
        KnowledgeRetrievalRequest req = new KnowledgeRetrievalRequest("paddy", 5, null, null, null);
        List<KnowledgeRetrievalResult> results = retrievalService.search(req);
        
        boolean containsWheat = results.stream().anyMatch(r -> r.getTitle().contains("Wheat"));
        assertThat(containsWheat).isFalse();
    }

    @Test
    @DisplayName("Step 9: Empty/Irrelevant Retrieval")
    void testEmptyRetrieval() {
        // V_IRRELEVANT distance from all crops is 1.0. All results should be excluded.
        KnowledgeRetrievalRequest req = new KnowledgeRetrievalRequest("space exploration", 5, null, null, null);
        List<KnowledgeRetrievalResult> results = retrievalService.search(req);
        
        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("Step 10 & 11: Context Assembly and Grounded Generation")
    void testContextAndGroundedness() {
        AdvisoryRequest req = new AdvisoryRequest();
        req.setFarmId(UUID.fromString("123e4567-e89b-12d3-a456-426614174000")); // Valid UUID format
        req.setQuestion("Tell me about paddy irrigation");

        // The Orchestrator will call retrieval (which will find Eval Paddy Doc 1),
        // assemble context, and call the MockChatModel.
        AdvisoryResponse res = orchestrationService.generateAdvisory(req, UUID.randomUUID());
        
        assertThat(res.getAnswer()).contains("Grounded response based on paddy knowledge.");
        assertThat(res.getSources()).hasSizeGreaterThanOrEqualTo(1);
        assertThat(res.getSources().get(0).getTitle()).isEqualTo("Eval Paddy Doc 1");
    }
}
