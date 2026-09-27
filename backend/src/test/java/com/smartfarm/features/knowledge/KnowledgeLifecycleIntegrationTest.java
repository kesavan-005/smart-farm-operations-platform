package com.smartfarm.features.knowledge;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.auth.security.TokenProvider;
import com.smartfarm.features.knowledge.domain.*;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import com.smartfarm.features.knowledge.repository.KnowledgeChunkRepository;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import com.smartfarm.features.knowledge.service.KnowledgeHealthService;
import com.smartfarm.features.knowledge.service.KnowledgeManagementService;
import com.smartfarm.features.knowledge.service.KnowledgeRetrievalService;
import com.smartfarm.features.knowledge.storage.DocumentStorageService;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.*;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.embedding.EmbeddingResultMetadata;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
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
    "spring.ai.vectorstore.pgvector.dimensions=384",
    "spring.ai.vectorstore.pgvector.distance-type=COSINE_DISTANCE",
    "spring.ai.vectorstore.pgvector.index-type=HNSW",
    "smartfarm.knowledge.retrieval.max-distance=0.4"
})
@DisplayName("Phase 2.6 - Knowledge Management & Lifecycle Integration Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class KnowledgeLifecycleIntegrationTest {

    static final int DIMENSION = 384;

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
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private TokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private KnowledgeDocumentRepository documentRepository;

    @Autowired
    private KnowledgeChunkRepository chunkRepository;

    @Autowired
    private DocumentStorageService storageService;

    @Autowired
    private KnowledgeManagementService managementService;

    @Autowired
    private KnowledgeHealthService healthService;

    @Autowired
    private KnowledgeRetrievalService retrievalService;

    @Autowired
    private PgVectorStore vectorStore;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User adminUser;
    private User workerUser;
    private String adminToken;
    private String workerToken;

    private UUID testDocId;

    @BeforeEach
    void setUp() {
        // Ensure test admin user exists
        adminUser = userRepository.save(User.builder()
                .name("Knowledge Admin")
                .firstName("Knowledge")
                .lastName("Admin")
                .phone("KNOW_ADMIN_" + UUID.randomUUID().toString().substring(0, 8))
                .username("know_admin_" + UUID.randomUUID().toString().substring(0, 8))
                .email("know_admin_" + UUID.randomUUID().toString().substring(0, 8) + "@smartfarm.com")
                .passwordHash("$2a$10$dummyhashfortesting")
                .role(Role.ADMIN)
                .isActive(true)
                .isVerified(true)
                .tokenVersion(1L)
                .build());

        workerUser = userRepository.save(User.builder()
                .name("Knowledge Worker")
                .firstName("Knowledge")
                .lastName("Worker")
                .phone("KNOW_WORKER_" + UUID.randomUUID().toString().substring(0, 8))
                .username("know_worker_" + UUID.randomUUID().toString().substring(0, 8))
                .email("know_worker_" + UUID.randomUUID().toString().substring(0, 8) + "@smartfarm.com")
                .passwordHash("$2a$10$dummyhashfortesting")
                .role(Role.WORKER)
                .isActive(true)
                .isVerified(true)
                .tokenVersion(1L)
                .build());

        adminToken = tokenProvider.generateAccessToken(adminUser.getId(), adminUser.getPhone(), "ADMIN", 1L);
        workerToken = tokenProvider.generateAccessToken(workerUser.getId(), workerUser.getPhone(), "WORKER", 1L);

        cleanUpAllTestDocs();
    }

    @AfterEach
    void tearDown() {
        cleanUpAllTestDocs();
        try {
            userRepository.delete(adminUser);
            userRepository.delete(workerUser);
        } catch (Exception ignored) {}
    }

    private void cleanUpAllTestDocs() {
        try {
            jdbcTemplate.execute("DELETE FROM vector_store WHERE metadata->>'title' LIKE 'LifecycleTest%'");
            jdbcTemplate.execute("DELETE FROM knowledge_chunks WHERE document_id IN (SELECT id FROM knowledge_documents WHERE title LIKE 'LifecycleTest%')");
            List<KnowledgeDocument> testDocs = documentRepository.findAll((root, query, cb) -> cb.like(root.get("title"), "LifecycleTest%"));
            for (KnowledgeDocument d : testDocs) {
                if (d.getStoragePath() != null) {
                    try { storageService.deleteDocument(d.getStoragePath()); } catch (Exception ignored) {}
                }
            }
            jdbcTemplate.execute("DELETE FROM knowledge_documents WHERE title LIKE 'LifecycleTest%'");
        } catch (Exception ignored) {}
    }

    private String getBaseUrl() {
        return "http://localhost:" + port + "/api/v1/knowledge";
    }

    @Test
    @Order(1)
    @DisplayName("Security: Unauthenticated request to /api/v1/knowledge returns 401 Unauthorized")
    void testSecurity_Unauthenticated() {
        ResponseEntity<String> response = restTemplate.getForEntity(getBaseUrl(), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @Order(2)
    @DisplayName("Security: Non-admin (WORKER) request to /api/v1/knowledge returns 403 Forbidden")
    void testSecurity_NonAdminForbidden() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(workerToken);
        HttpEntity<?> request = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(getBaseUrl(), HttpMethod.GET, request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @Order(3)
    @DisplayName("Security & Read: Admin request to /api/v1/knowledge returns 200 OK with document list")
    void testListDocuments_AdminSuccess() throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<?> request = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(getBaseUrl(), HttpMethod.GET, request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode data = root.get("data");
        assertThat(data).isNotNull();
        assertThat(data.get("content").size()).isGreaterThanOrEqualTo(5);
    }

    @Test
    @Order(4)
    @DisplayName("Health: GET /api/v1/knowledge/health returns comprehensive repository status")
    void testKnowledgeHealthReport() throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<?> request = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(getBaseUrl() + "/health", HttpMethod.GET, request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode data = root.get("data");
        assertThat(data.get("healthy").asBoolean()).isTrue();
        assertThat(data.get("activeDocuments").asInt()).isGreaterThanOrEqualTo(5);
        assertThat(data.get("totalChunks").asInt()).isGreaterThanOrEqualTo(5000);
        assertThat(data.get("totalVectors").asInt()).isGreaterThanOrEqualTo(5000);
        assertThat(data.get("chunksWithoutVectorsCount").asInt()).isEqualTo(0);
        assertThat(data.get("orphanVectorsCount").asInt()).isEqualTo(0);
    }

    @Test
    @Order(5)
    @DisplayName("Filtering: GET /api/v1/knowledge with filters narrows results correctly")
    void testFilterDocuments() throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        HttpEntity<?> request = new HttpEntity<>(headers);

        // Filter by source=Tamil Nadu
        ResponseEntity<String> response = restTemplate.exchange(
                getBaseUrl() + "?source=Tamil Nadu&status=ACTIVE",
                HttpMethod.GET,
                request,
                String.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode content = root.get("data").get("content");
        assertThat(content.size()).isGreaterThanOrEqualTo(1);
        for (JsonNode item : content) {
            assertThat(item.get("source").asText()).contains("Tamil Nadu");
            assertThat(item.get("status").asText()).isEqualTo("ACTIVE");
        }
    }

    @Test
    @Order(6)
    @DisplayName("Lifecycle & RAG: Complete DRAFT -> ACTIVE -> ARCHIVED transition and RAG retrieval gating")
    void testCompleteLifecycleAndRagCompatibility() throws Exception {
        // 1. Create a DRAFT test document
        byte[] dummyPdfBytes = "%PDF-1.4 dummy agricultural document".getBytes(StandardCharsets.UTF_8);

        KnowledgeDocument draftDoc = KnowledgeDocument.builder()
                .title("LifecycleTest - Blackgram Pulse Guide")
                .source("TNAU")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .authority("TNAU Agronomy")
                .language(KnowledgeLanguage.ENGLISH)
                .crop("blackgram")
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .version("1.0")
                .publishedDate(LocalDate.of(2025, 1, 1))
                .lastVerifiedAt(OffsetDateTime.now())
                .status(DocumentStatus.DRAFT) // DRAFT!
                .originalFilename("test.pdf")
                .contentType("application/pdf")
                .fileSizeBytes((long) dummyPdfBytes.length)
                .build();
        draftDoc = documentRepository.save(draftDoc);
        testDocId = draftDoc.getId();

        String storagePath = "knowledge/" + testDocId + "/test.pdf";
        storageService.storeDocument(testDocId, "test.pdf", "application/pdf", dummyPdfBytes);
        draftDoc.setStoragePath(storagePath);
        draftDoc = documentRepository.save(draftDoc);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        // 2. Activation Safety: Activating DRAFT with 0 chunks must fail with 400 Bad Request
        HttpEntity<?> activateRequest = new HttpEntity<>(headers);
        ResponseEntity<String> failActivate = restTemplate.exchange(
                getBaseUrl() + "/" + testDocId + "/activate",
                HttpMethod.POST,
                activateRequest,
                String.class
        );
        assertThat(failActivate.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // 3. Add chunks and corresponding vector for the test document
        KnowledgeChunk chunk = KnowledgeChunk.builder()
                .document(draftDoc)
                .chunkIndex(0)
                .content("LifecycleTest content: Recommended seed rate for blackgram is 20 kg per hectare.")
                .language(KnowledgeLanguage.ENGLISH)
                .build();
        chunk = chunkRepository.save(chunk);
        UUID actualChunkId = chunk.getId();

        // Insert vector with DRAFT status
        Document aiDoc = new Document(
                actualChunkId.toString(),
                chunk.getContent(),
                java.util.Map.of(
                        "knowledgeDocumentId", testDocId.toString(),
                        "knowledgeChunkId", actualChunkId.toString(),
                        "title", draftDoc.getTitle(),
                        "crop", "blackgram",
                        "topic", "CROP_MANAGEMENT",
                        "status", "DRAFT"
                )
        );
        vectorStore.add(List.of(aiDoc));

        // 4. Verify RAG Exclusion: DRAFT document is NOT retrieved by KnowledgeRetrievalService
        List<KnowledgeRetrievalResult> draftResults = retrievalService.search(
                KnowledgeRetrievalRequest.builder()
                        .query("LifecycleTest recommended seed rate blackgram")
                        .topK(10)
                        .crop("blackgram")
                        .build()
        );
        boolean foundDraftInRag = draftResults.stream()
                .anyMatch(r -> testDocId.toString().equals(r.getKnowledgeDocumentId()));
        assertThat(foundDraftInRag).as("DRAFT document must NOT participate in RAG retrieval").isFalse();

        // 5. Activation: Now that file, chunks, and vectors exist, activate document
        ResponseEntity<String> activateSuccess = restTemplate.exchange(
                getBaseUrl() + "/" + testDocId + "/activate",
                HttpMethod.POST,
                activateRequest,
                String.class
        );
        assertThat(activateSuccess.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode activeNode = objectMapper.readTree(activateSuccess.getBody());
        assertThat(activeNode.get("data").get("status").asText()).isEqualTo("ACTIVE");

        // 6. Verify RAG Inclusion: ACTIVE document IS retrieved by KnowledgeRetrievalService
        List<KnowledgeRetrievalResult> activeResults = retrievalService.search(
                KnowledgeRetrievalRequest.builder()
                        .query("LifecycleTest recommended seed rate blackgram")
                        .topK(10)
                        .crop("blackgram")
                        .build()
        );
        boolean foundActiveInRag = activeResults.stream()
                .anyMatch(r -> testDocId.toString().equals(r.getKnowledgeDocumentId()));
        assertThat(foundActiveInRag).as("ACTIVE document MUST be eligible for RAG retrieval").isTrue();

        // 7. Archiving: Archive the active document
        HttpEntity<?> archiveRequest = new HttpEntity<>(headers);
        ResponseEntity<String> archiveSuccess = restTemplate.exchange(
                getBaseUrl() + "/" + testDocId + "/archive",
                HttpMethod.POST,
                archiveRequest,
                String.class
        );
        assertThat(archiveSuccess.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode archivedNode = objectMapper.readTree(archiveSuccess.getBody());
        assertThat(archivedNode.get("data").get("status").asText()).isEqualTo("ARCHIVED");

        // 8. Verify RAG Exclusion: ARCHIVED document is NO LONGER retrieved by KnowledgeRetrievalService
        List<KnowledgeRetrievalResult> archivedResults = retrievalService.search(
                KnowledgeRetrievalRequest.builder()
                        .query("LifecycleTest recommended seed rate blackgram")
                        .topK(10)
                        .crop("blackgram")
                        .build()
        );
        boolean foundArchivedInRag = archivedResults.stream()
                .anyMatch(r -> testDocId.toString().equals(r.getKnowledgeDocumentId()));
        assertThat(foundArchivedInRag).as("ARCHIVED document must be EXCLUDED from RAG retrieval").isFalse();

        // 9. Verify Archive Preservation: document, chunks, vectors, and MinIO storage remain intact
        assertThat(documentRepository.existsById(testDocId)).isTrue();
        assertThat(chunkRepository.countByDocument_Id(testDocId)).isEqualTo(1);
        assertThat(storageService.documentExists(storagePath)).isTrue();

        Integer vectorCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM vector_store WHERE id = ?",
                Integer.class,
                actualChunkId
        );
        assertThat(vectorCount).isEqualTo(1);
    }
}
