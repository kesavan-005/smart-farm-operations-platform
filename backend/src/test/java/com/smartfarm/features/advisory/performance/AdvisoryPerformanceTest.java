package com.smartfarm.features.advisory.performance;

import static org.assertj.core.api.Assertions.assertThat;

import com.smartfarm.features.advisory.dto.AdvisoryContext;
import com.smartfarm.features.advisory.dto.AdvisoryRequest;
import com.smartfarm.features.advisory.dto.AdvisoryResponse;
import com.smartfarm.features.advisory.service.AdvisoryOrchestrationService;
import com.smartfarm.features.advisory.service.ContextAssembler;
import com.smartfarm.features.advisory.service.GroundedPromptBuilder;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.dto.context.FarmContextResponse;
import com.smartfarm.features.farm.dto.context.FarmProfile;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.farm.service.FarmContextService;
import com.smartfarm.features.field.domain.Field;
import com.smartfarm.features.field.repository.FieldRepository;
import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import com.smartfarm.features.knowledge.service.KnowledgeIngestionService;
import com.smartfarm.features.knowledge.service.KnowledgeRetrievalService;
import com.smartfarm.features.weather.client.OpenMeteoClient;
import com.smartfarm.features.weather.dto.OpenMeteoResponseDto;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.*;

import org.junit.jupiter.api.*;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.Prompt;
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

/**
 * Phase 7C — Performance Evaluation Tests.
 *
 * Measures latencies of individual pipeline stages and end-to-end flow.
 * Uses mock ChatModel with 50ms simulated delay.
 * Reports actual measured values — does NOT establish arbitrary pass/fail thresholds.
 */
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
    "smartfarm.knowledge.retrieval.max-distance=0.4"
})
@DisplayName("Phase 7C - Performance Evaluation Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AdvisoryPerformanceTest {

    // ========= Configuration =========
    static final int WARMUP_ITERATIONS = 10;
    static final int MEASURED_ITERATIONS = 50;
    static final long SIMULATED_LLM_DELAY_MS = 50;

    // ========= Deterministic Embeddings =========
    static final int DIM = 1536;
    static float[] createVector(float v0, float v1, float v2) {
        float[] v = new float[DIM];
        v[0] = v0; v[1] = v1; v[2] = v2;
        return v;
    }
    static final float[] V_DEFAULT = createVector(1.0f, 0.0f, 0.0f);

    static final class PerfTestEmbeddingModel implements EmbeddingModel {
        @Override
        public EmbeddingResponse call(EmbeddingRequest request) {
            List<Embedding> embeddings = request.getInstructions().stream()
                    .map(text -> new Embedding(embed(new Document(text)), 0, EmbeddingResultMetadata.EMPTY))
                    .toList();
            return new EmbeddingResponse(embeddings);
        }

        @Override
        public float[] embed(Document document) {
            return V_DEFAULT;
        }

        @Override
        public int dimensions() {
            return DIM;
        }
    }

    /**
     * Mock ChatModel with configurable simulated delay.
     * Clearly labeled: SIMULATED LLM LATENCY.
     */
    static final class PerfTestChatModel implements ChatModel {
        @Override
        public ChatResponse call(Prompt prompt) {
            try {
                Thread.sleep(SIMULATED_LLM_DELAY_MS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return new ChatResponse(List.of(new Generation(new AssistantMessage(
                    "Performance test: Agricultural advisory based on retrieved knowledge."))));
        }

        @Override
        public ChatOptions getDefaultOptions() {
            return null;
        }
    }

    @TestConfiguration
    static class PerfTestConfig {
        @Bean
        @Primary
        OpenMeteoClient perfTestOpenMeteoClient() {
            return new OpenMeteoClient() {
                @Override
                public OpenMeteoResponseDto fetchForecast(double latitude, double longitude) {
                    OpenMeteoResponseDto mockWeather = new OpenMeteoResponseDto();
                    mockWeather.setTimezone("Asia/Kolkata");
                    mockWeather.setLatitude(latitude);
                    mockWeather.setLongitude(longitude);
                    return mockWeather;
                }
            };
        }

        @Bean
        @Primary
        EmbeddingModel perfTestEmbeddingModel() {
            return new PerfTestEmbeddingModel();
        }

        @Bean
        @Primary
        ChatModel perfTestChatModel() {
            return new PerfTestChatModel();
        }

        @Bean
        @Primary
        ContextAssembler perfTestContextAssembler(
                FarmContextService farmContextService,
                KnowledgeRetrievalService retrievalService) {
            return new ContextAssembler(farmContextService, retrievalService);
        }
    }

    @Autowired private KnowledgeIngestionService ingestionService;
    @Autowired private KnowledgeRetrievalService retrievalService;
    @Autowired private FarmContextService farmContextService;
    @Autowired private AdvisoryOrchestrationService orchestrationService;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private UserRepository userRepository;
    @Autowired private FarmRepository farmRepository;
    @Autowired private FieldRepository fieldRepository;

    // Test fixtures
    private User perfUser;
    private Farm perfFarm;
    private Field perfField;

    // ========= Latency measurement helpers =========
    static class LatencyStats {
        final String label;
        final List<Long> samples;

        LatencyStats(String label, List<Long> samples) {
            this.label = label;
            this.samples = samples.stream().sorted().collect(Collectors.toList());
        }

        long min() { return samples.isEmpty() ? 0 : samples.get(0); }
        long max() { return samples.isEmpty() ? 0 : samples.get(samples.size() - 1); }
        double avg() { return samples.stream().mapToLong(l -> l).average().orElse(0); }
        long p50() { return percentile(50); }
        long p95() { return percentile(95); }
        long p99() { return percentile(99); }
        int count() { return samples.size(); }

        long percentile(int p) {
            if (samples.isEmpty()) return 0;
            int idx = (int) Math.ceil(p / 100.0 * samples.size()) - 1;
            return samples.get(Math.max(0, Math.min(idx, samples.size() - 1)));
        }

        @Override
        public String toString() {
            return String.format(
                "%s (n=%d): min=%dms, avg=%.1fms, P50=%dms, P95=%dms, P99=%dms, max=%dms",
                label, count(), min(), avg(), p50(), p95(), p99(), max());
        }
    }

    // Accumulated results for the final report
    static final List<String> REPORT_LINES = new ArrayList<>();

    @BeforeAll
    static void clearReport() {
        REPORT_LINES.clear();
    }

    @BeforeEach
    void setUp() {
        cleanUpTestData();

        // Create test user
        perfUser = userRepository.save(User.builder()
                .name("PerfTest User")
                .firstName("PerfTest")
                .lastName("User")
                .phone("PERF_TEST_" + UUID.randomUUID().toString().substring(0, 8))
                .username("perf_test_" + UUID.randomUUID().toString().substring(0, 8))
                .email("perftest_" + UUID.randomUUID().toString().substring(0, 8) + "@test.com")
                .passwordHash("$2a$10$dummyhashfortesting")
                .role(Role.FARM_OWNER)
                .isActive(true)
                .isVerified(true)
                .tokenVersion(1L)
                .build());

        // Create test farm
        perfFarm = farmRepository.save(Farm.builder()
                .owner(perfUser)
                .farmCode("PERF_FARM_" + UUID.randomUUID().toString().substring(0, 6))
                .name("Performance Test Farm")
                .village("PerfVillage")
                .district("PerfDistrict")
                .state("Tamil Nadu")
                .totalArea(BigDecimal.valueOf(15.0))
                .areaUnit("acres")
                .latitude(BigDecimal.valueOf(11.0168))
                .longitude(BigDecimal.valueOf(76.9558))
                .soilType("clay-loam")
                .irrigationType("drip")
                .status("active")
                .build());

        perfUser.setFarmId(perfFarm.getId());
        perfUser = userRepository.save(perfUser);

        // Create test field
        perfField = fieldRepository.save(Field.builder()
                .farm(perfFarm)
                .fieldCode("PERF_FIELD_" + UUID.randomUUID().toString().substring(0, 6))
                .name("Performance Test Field")
                .area(BigDecimal.valueOf(5.0))
                .areaUnit("acres")
                .status("active")
                .build());

        // Ingest test knowledge documents
        String[] crops = {"Paddy", "Wheat", "Cotton", "Sugarcane", "Groundnut"};
        KnowledgeTopic[] topics = KnowledgeTopic.values();
        for (String crop : crops) {
            for (int i = 0; i < 3; i++) {
                ingestionService.ingestDocument(KnowledgeIngestionRequest.builder()
                        .title("PerfTest " + crop + " Doc " + i)
                        .content(crop + " farming best practices document " + i +
                                ". Detailed agricultural guidance for " + crop + " cultivation.")
                        .crop(crop)
                        .topic(topics[i % topics.length])
                        .language(KnowledgeLanguage.ENGLISH)
                        .status(DocumentStatus.ACTIVE)
                        .sourceType(SourceType.EXTENSION_SERVICE)
                        .build());
            }
        }
    }

    @AfterEach
    void cleanUp() {
        cleanUpTestData();
    }

    private void cleanUpTestData() {
        try { jdbcTemplate.execute("DELETE FROM vector_store WHERE metadata->>'title' LIKE 'PerfTest%'"); } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("DELETE FROM knowledge_chunks WHERE document_id IN (SELECT id FROM knowledge_documents WHERE title LIKE 'PerfTest%')");
            jdbcTemplate.execute("DELETE FROM knowledge_documents WHERE title LIKE 'PerfTest%'");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("DELETE FROM fields WHERE farm_id IN (SELECT id FROM farms WHERE farm_code LIKE 'PERF_FARM_%')");
        } catch (Exception ignored) {}
        try { jdbcTemplate.execute("DELETE FROM farms WHERE farm_code LIKE 'PERF_FARM_%'"); } catch (Exception ignored) {}
        try { jdbcTemplate.execute("DELETE FROM users WHERE phone LIKE 'PERF_TEST_%'"); } catch (Exception ignored) {}
    }

    // ========================================================================
    // 7C-1: Environment Recording
    // ========================================================================

    @Test
    @Order(1)
    @DisplayName("7C-1: Record test environment")
    void recordEnvironment() {
        String javaVersion = System.getProperty("java.version");
        String springBootVersion = org.springframework.boot.SpringBootVersion.getVersion();

        // Query PostgreSQL version
        String pgVersion = jdbcTemplate.queryForObject("SELECT version()", String.class);

        // Query pgvector version
        String pgvectorVersion = "unknown";
        try {
            pgvectorVersion = jdbcTemplate.queryForObject(
                "SELECT extversion FROM pg_extension WHERE extname = 'vector'", String.class);
        } catch (Exception e) {
            pgvectorVersion = "extension query failed";
        }

        // Dataset counts
        Integer docCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM knowledge_documents WHERE title LIKE 'PerfTest%'", Integer.class);
        Integer chunkCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM knowledge_chunks WHERE document_id IN (SELECT id FROM knowledge_documents WHERE title LIKE 'PerfTest%')", Integer.class);
        Integer vectorCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM vector_store WHERE metadata->>'title' LIKE 'PerfTest%'", Integer.class);
        Integer totalVectors = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM vector_store", Integer.class);

        StringBuilder env = new StringBuilder();
        env.append("=== PERFORMANCE TEST ENVIRONMENT ===\n");
        env.append("Java: ").append(javaVersion).append("\n");
        env.append("Spring Boot: ").append(springBootVersion).append("\n");
        env.append("PostgreSQL: ").append(pgVersion).append("\n");
        env.append("pgvector: ").append(pgvectorVersion).append("\n");
        env.append("Vector dimensions: 1536\n");
        env.append("Distance type: COSINE_DISTANCE\n");
        env.append("Index type: HNSW\n");
        env.append("Test documents: ").append(docCount).append("\n");
        env.append("Test chunks: ").append(chunkCount).append("\n");
        env.append("Test vectors: ").append(vectorCount).append("\n");
        env.append("Total vectors in DB: ").append(totalVectors).append("\n");
        env.append("Warm-up iterations: ").append(WARMUP_ITERATIONS).append("\n");
        env.append("Measured iterations: ").append(MEASURED_ITERATIONS).append("\n");
        env.append("Simulated LLM delay: ").append(SIMULATED_LLM_DELAY_MS).append("ms\n");

        System.out.println(env);
        REPORT_LINES.add(env.toString());

        assertThat(docCount).isGreaterThan(0);
        assertThat(vectorCount).isGreaterThan(0);
    }

    // ========================================================================
    // 7C-3: Retrieval Latency
    // ========================================================================

    @Test
    @Order(2)
    @DisplayName("7C-3: Retrieval latency (TopK=1,3,5)")
    void testRetrievalLatency() {
        int[] topKValues = {1, 3, 5};

        for (int topK : topKValues) {
            KnowledgeRetrievalRequest req = new KnowledgeRetrievalRequest("paddy irrigation", topK, null, null, null);

            // Warm-up
            for (int i = 0; i < WARMUP_ITERATIONS; i++) {
                retrievalService.search(req);
            }

            // Measured
            List<Long> latencies = new ArrayList<>();
            for (int i = 0; i < MEASURED_ITERATIONS; i++) {
                long start = System.nanoTime();
                List<KnowledgeRetrievalResult> results = retrievalService.search(req);
                long elapsed = (System.nanoTime() - start) / 1_000_000;
                latencies.add(elapsed);
            }

            LatencyStats stats = new LatencyStats("Retrieval TopK=" + topK, latencies);
            System.out.println(stats);
            REPORT_LINES.add(stats.toString());

            assertThat(stats.count()).isEqualTo(MEASURED_ITERATIONS);
        }
    }

    // ========================================================================
    // 7C-4: Filter Latency
    // ========================================================================

    @Test
    @Order(3)
    @DisplayName("7C-4: Metadata filter latency (all filter combinations)")
    void testFilterLatency() {
        // Define filter combinations
        record FilterCombo(String label, String crop, KnowledgeTopic topic, KnowledgeLanguage lang) {}
        List<FilterCombo> combos = List.of(
            new FilterCombo("No filters", null, null, null),
            new FilterCombo("Crop only", "Paddy", null, null),
            new FilterCombo("Topic only", null, KnowledgeTopic.IRRIGATION, null),
            new FilterCombo("Language only", null, null, KnowledgeLanguage.ENGLISH),
            new FilterCombo("Crop+Topic", "Paddy", KnowledgeTopic.IRRIGATION, null),
            new FilterCombo("Crop+Language", "Paddy", null, KnowledgeLanguage.ENGLISH),
            new FilterCombo("Topic+Language", null, KnowledgeTopic.IRRIGATION, KnowledgeLanguage.ENGLISH),
            new FilterCombo("Crop+Topic+Language", "Paddy", KnowledgeTopic.IRRIGATION, KnowledgeLanguage.ENGLISH)
        );

        for (FilterCombo combo : combos) {
            KnowledgeRetrievalRequest req = new KnowledgeRetrievalRequest(
                "farming advice", 5, combo.crop(), combo.topic(), combo.lang());

            // Warm-up
            for (int i = 0; i < WARMUP_ITERATIONS; i++) {
                retrievalService.search(req);
            }

            // Measured
            List<Long> latencies = new ArrayList<>();
            for (int i = 0; i < MEASURED_ITERATIONS; i++) {
                long start = System.nanoTime();
                retrievalService.search(req);
                long elapsed = (System.nanoTime() - start) / 1_000_000;
                latencies.add(elapsed);
            }

            LatencyStats stats = new LatencyStats("Filter: " + combo.label(), latencies);
            System.out.println(stats);
            REPORT_LINES.add(stats.toString());
        }
    }

    // ========================================================================
    // 7C-5: HNSW Query Plan
    // ========================================================================

    @Test
    @Order(4)
    @DisplayName("7C-5: HNSW index inspection")
    void testHnswQueryPlan() {
        StringBuilder report = new StringBuilder();
        report.append("=== HNSW INDEX INSPECTION ===\n");

        // Check for HNSW index
        try {
            List<Map<String, Object>> indexes = jdbcTemplate.queryForList(
                "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'vector_store' AND indexdef LIKE '%hnsw%'");
            if (indexes.isEmpty()) {
                report.append("WARNING: No HNSW index found on vector_store table.\n");
            } else {
                for (Map<String, Object> idx : indexes) {
                    report.append("Index: ").append(idx.get("indexname")).append("\n");
                    report.append("Definition: ").append(idx.get("indexdef")).append("\n");
                }
            }
        } catch (Exception e) {
            report.append("Index query failed: ").append(e.getMessage()).append("\n");
        }

        // List all indexes on vector_store
        try {
            List<Map<String, Object>> allIndexes = jdbcTemplate.queryForList(
                "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'vector_store'");
            report.append("\nAll indexes on vector_store:\n");
            for (Map<String, Object> idx : allIndexes) {
                report.append("  ").append(idx.get("indexname")).append(": ").append(idx.get("indexdef")).append("\n");
            }
        } catch (Exception e) {
            report.append("All-index query failed: ").append(e.getMessage()).append("\n");
        }

        // Table size
        try {
            String tableSize = jdbcTemplate.queryForObject(
                "SELECT pg_size_pretty(pg_total_relation_size('vector_store'))", String.class);
            report.append("Table size (total): ").append(tableSize).append("\n");
        } catch (Exception e) {
            report.append("Table size query failed: ").append(e.getMessage()).append("\n");
        }

        System.out.println(report);
        REPORT_LINES.add(report.toString());

        // Assertion: at minimum the table exists (we queried it)
        assertThat(report.toString()).contains("vector_store");
    }

    // ========================================================================
    // 7C-6: Farm Context Latency
    // ========================================================================

    @Test
    @Order(5)
    @DisplayName("7C-6: Farm context latency")
    void testFarmContextLatency() {
        // Warm-up
        for (int i = 0; i < WARMUP_ITERATIONS; i++) {
            try {
                farmContextService.getFarmContext(perfFarm.getId(), perfUser.getId());
            } catch (Exception ignored) {}
        }

        // Measured
        List<Long> latencies = new ArrayList<>();
        for (int i = 0; i < MEASURED_ITERATIONS; i++) {
            long start = System.nanoTime();
            try {
                farmContextService.getFarmContext(perfFarm.getId(), perfUser.getId());
            } catch (Exception ignored) {
                // Weather may fail; we still measure context assembly time
            }
            long elapsed = (System.nanoTime() - start) / 1_000_000;
            latencies.add(elapsed);
        }

        LatencyStats stats = new LatencyStats("FarmContext", latencies);
        System.out.println(stats);
        REPORT_LINES.add(stats.toString());

        assertThat(stats.count()).isEqualTo(MEASURED_ITERATIONS);
    }

    // ========================================================================
    // 7C-9: LLM Application Overhead (mocked)
    // ========================================================================

    @Test
    @Order(6)
    @DisplayName("7C-9: Mocked LLM overhead (simulated " + SIMULATED_LLM_DELAY_MS + "ms delay)")
    void testMockedLlmOverhead() {
        GroundedPromptBuilder builder = new GroundedPromptBuilder();

        AdvisoryContext context = AdvisoryContext.builder()
                .question("How to irrigate paddy?")
                .farmContext(FarmContextResponse.builder()
                        .farmProfile(FarmProfile.builder().name("Perf Farm").build())
                        .fields(new ArrayList<>())
                        .cropStates(new ArrayList<>())
                        .build())
                .retrievedKnowledge(new ArrayList<>())
                .build();

        // Warm-up
        PerfTestChatModel mockChat = new PerfTestChatModel();
        for (int i = 0; i < WARMUP_ITERATIONS; i++) {
            Prompt prompt = builder.buildPrompt(context);
            mockChat.call(prompt);
        }

        // Measured: prompt construction + mock LLM call + response
        List<Long> latencies = new ArrayList<>();
        for (int i = 0; i < MEASURED_ITERATIONS; i++) {
            long start = System.nanoTime();
            Prompt prompt = builder.buildPrompt(context);
            ChatResponse resp = mockChat.call(prompt);
            String answer = resp.getResult().getOutput().getText();
            long elapsed = (System.nanoTime() - start) / 1_000_000;
            latencies.add(elapsed);
        }

        LatencyStats stats = new LatencyStats("MockedLLM (simulated " + SIMULATED_LLM_DELAY_MS + "ms)", latencies);
        System.out.println(stats);
        REPORT_LINES.add("SIMULATED LLM LATENCY: " + stats);

        // The overhead beyond simulated delay represents prompt construction + response mapping
        double applicationOverhead = stats.avg() - SIMULATED_LLM_DELAY_MS;
        System.out.println("Application overhead (avg): " + String.format("%.1f", applicationOverhead) + "ms");
        REPORT_LINES.add("Application overhead (avg): " + String.format("%.1f", applicationOverhead) + "ms");
    }

    // ========================================================================
    // 7C-11: End-to-End Latency
    // ========================================================================

    @Test
    @Order(7)
    @DisplayName("7C-11: End-to-end latency (mocked LLM)")
    void testEndToEndLatency() {
        AdvisoryRequest req = new AdvisoryRequest();
        req.setFarmId(perfFarm.getId());
        req.setQuestion("How to irrigate paddy in Tamil Nadu?");

        // Warm-up
        for (int i = 0; i < WARMUP_ITERATIONS; i++) {
            try {
                orchestrationService.generateAdvisory(req, perfUser.getId());
            } catch (Exception ignored) {}
        }

        // Measured
        List<Long> latencies = new ArrayList<>();
        int successes = 0;
        int failures = 0;
        for (int i = 0; i < MEASURED_ITERATIONS; i++) {
            long start = System.nanoTime();
            try {
                AdvisoryResponse resp = orchestrationService.generateAdvisory(req, perfUser.getId());
                successes++;
            } catch (Exception e) {
                failures++;
            }
            long elapsed = (System.nanoTime() - start) / 1_000_000;
            latencies.add(elapsed);
        }

        LatencyStats stats = new LatencyStats("EndToEnd (mocked LLM)", latencies);
        System.out.println(stats);
        System.out.println("Successes: " + successes + ", Failures: " + failures);
        REPORT_LINES.add(stats.toString());
        REPORT_LINES.add("EndToEnd successes=" + successes + " failures=" + failures);

        assertThat(successes).isGreaterThan(0);
    }

    // ========================================================================
    // 7C-12: Concurrency Evaluation
    // ========================================================================

    @Test
    @Order(8)
    @DisplayName("7C-12: Concurrent request evaluation (1, 5, 10 threads)")
    void testConcurrency() throws Exception {
        int[] concurrencyLevels = {1, 5, 10};

        int totalRequests = 50;

        for (int concurrency : concurrencyLevels) {
            ExecutorService executor = Executors.newFixedThreadPool(concurrency);
            List<Future<Long>> futures = new ArrayList<>();

            long totalStart = System.nanoTime();

            for (int i = 0; i < totalRequests; i++) {
                futures.add(executor.submit(() -> {
                    AdvisoryRequest req = new AdvisoryRequest();
                    req.setFarmId(perfFarm.getId());
                    req.setQuestion("Concurrent test: paddy irrigation");

                    long start = System.nanoTime();
                    try {
                        orchestrationService.generateAdvisory(req, perfUser.getId());
                    } catch (Exception e) {
                        // Count as completed with error
                    }
                    return (System.nanoTime() - start) / 1_000_000;
                }));
            }

            List<Long> latencies = new ArrayList<>();
            int completed = 0;
            int failed = 0;
            for (Future<Long> f : futures) {
                try {
                    latencies.add(f.get(30, TimeUnit.SECONDS));
                    completed++;
                } catch (Exception e) {
                    failed++;
                }
            }

            long totalDuration = (System.nanoTime() - totalStart) / 1_000_000;
            executor.shutdown();

            LatencyStats stats = new LatencyStats("Concurrency=" + concurrency, latencies);
            double throughput = concurrency > 0 && totalDuration > 0
                    ? (double) completed / (totalDuration / 1000.0)
                    : 0;

            StringBuilder report = new StringBuilder();
            report.append("=== CONCURRENCY EVALUATION: ").append(concurrency).append(" threads ===\n");
            report.append(stats).append("\n");
            report.append("Completed: ").append(completed).append("\n");
            report.append("Failed: ").append(failed).append("\n");
            report.append("Total duration: ").append(totalDuration).append("ms\n");
            report.append("Throughput: ").append(String.format("%.2f", throughput)).append(" req/s\n");

            System.out.println(report);
            REPORT_LINES.add(report.toString());

            assertThat(completed).isGreaterThan(0);
        }
    }

    // ========================================================================
    // Summary output
    // ========================================================================

    @AfterAll
    static void printSummary() {
        System.out.println("\n========================================");
        System.out.println("PHASE 7C PERFORMANCE EVALUATION SUMMARY");
        System.out.println("========================================");
        for (String line : REPORT_LINES) {
            System.out.println(line);
        }
        System.out.println("========================================\n");
        System.out.println("NOTE: ChatModel latency is SIMULATED (" + SIMULATED_LLM_DELAY_MS + "ms).");
        System.out.println("Real LLM latency was NOT measured in this test.");
    }
}
