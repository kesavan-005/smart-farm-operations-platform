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
import com.smartfarm.features.knowledge.service.KnowledgeManagementService;
import com.smartfarm.features.knowledge.service.KnowledgeRetrievalService;
import com.smartfarm.features.knowledge.storage.DocumentStorageService;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.junit.jupiter.api.*;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.embedding.EmbeddingResultMetadata;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

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
@DisplayName("Phase 2.7 - Controlled Knowledge Document Ingestion Integration Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class KnowledgeDocumentIngestionIntegrationTest {

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
    private KnowledgeRetrievalService retrievalService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User adminUser;
    private User workerUser;
    private String adminToken;
    private String workerToken;

    @BeforeEach
    void setUp() {
        adminUser = userRepository.save(User.builder()
                .name("Ingestion Admin")
                .firstName("Ingestion")
                .lastName("Admin")
                .phone("ING_ADMIN_" + UUID.randomUUID().toString().substring(0, 8))
                .username("ing_admin_" + UUID.randomUUID().toString().substring(0, 8))
                .email("ing_admin_" + UUID.randomUUID().toString().substring(0, 8) + "@smartfarm.com")
                .passwordHash("$2a$10$dummyhashfortesting")
                .role(Role.ADMIN)
                .isActive(true)
                .isVerified(true)
                .tokenVersion(1L)
                .build());

        workerUser = userRepository.save(User.builder()
                .name("Ingestion Worker")
                .firstName("Ingestion")
                .lastName("Worker")
                .phone("ING_WORKER_" + UUID.randomUUID().toString().substring(0, 8))
                .username("ing_worker_" + UUID.randomUUID().toString().substring(0, 8))
                .email("ing_worker_" + UUID.randomUUID().toString().substring(0, 8) + "@smartfarm.com")
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
            jdbcTemplate.execute("DELETE FROM vector_store WHERE metadata->>'title' LIKE 'IngestTest%'");
            jdbcTemplate.execute("DELETE FROM knowledge_chunks WHERE document_id IN (SELECT id FROM knowledge_documents WHERE title LIKE 'IngestTest%')");
            List<KnowledgeDocument> testDocs = documentRepository.findAll((root, query, cb) -> cb.like(root.get("title"), "IngestTest%"));
            for (KnowledgeDocument d : testDocs) {
                if (d.getStoragePath() != null) {
                    try { storageService.deleteDocument(d.getStoragePath()); } catch (Exception ignored) {}
                }
            }
            jdbcTemplate.execute("DELETE FROM knowledge_documents WHERE title LIKE 'IngestTest%'");
        } catch (Exception ignored) {}
    }

    private String getBaseUrl() {
        return "http://localhost:" + port + "/api/v1/knowledge";
    }

    private byte[] createSamplePdf(String text) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA, 12);
                cs.newLineAtOffset(50, 700);
                cs.showText(text);
                cs.endText();
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private byte[] createSampleDocx(String text) throws IOException {
        try (XWPFDocument doc = new XWPFDocument()) {
            XWPFParagraph p = doc.createParagraph();
            p.createRun().setText(text);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.write(baos);
            return baos.toByteArray();
        }
    }

    private HttpEntity<ByteArrayResource> createPart(byte[] bytes, String filename, String contentType) {
        ByteArrayResource resource = new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        };
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        return new HttpEntity<>(resource, headers);
    }

    @Test
    @Order(1)
    @DisplayName("Test K: Unauthorized upload rejected - unauthenticated returns 401 Unauthorized")
    void testSecurity_Unauthenticated_Rejected() throws Exception {
        byte[] pdfBytes = createSamplePdf("Test agricultural guide content");
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", createPart(pdfBytes, "guide.pdf", "application/pdf"));
        body.add("title", "IngestTest - Unauthenticated");
        body.add("sourceType", "AGRICULTURAL_UNIVERSITY");
        body.add("language", "ENGLISH");
        body.add("topic", "CROP_MANAGEMENT");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(getBaseUrl() + "/documents", request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @Order(2)
    @DisplayName("Test K: Non-admin upload rejected - WORKER returns 403 Forbidden")
    void testSecurity_Worker_Forbidden() throws Exception {
        byte[] pdfBytes = createSamplePdf("Test agricultural guide content");
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", createPart(pdfBytes, "guide.pdf", "application/pdf"));
        body.add("title", "IngestTest - Worker Forbidden");
        body.add("sourceType", "AGRICULTURAL_UNIVERSITY");
        body.add("language", "ENGLISH");
        body.add("topic", "CROP_MANAGEMENT");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(workerToken);
        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(getBaseUrl() + "/documents", request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @Order(3)
    @DisplayName("Tests A, L, M, N, O, P, Q, R, S, T: Upload PDF successfully and complete lifecycle verification")
    void testUploadPdf_Success_And_FullLifecycle() throws Exception {
        String uniqueContent = "IngestTest PDF: Rhizobium biofertilizer inoculation recommended for blackgram pulse crops at 200g per 10kg seeds.";
        byte[] pdfBytes = createSamplePdf(uniqueContent);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", createPart(pdfBytes, "blackgram_guide_2026.pdf", "application/pdf"));
        body.add("title", "IngestTest - TNAU Blackgram Guide 2026");
        body.add("source", "TNAU");
        body.add("sourceType", "AGRICULTURAL_UNIVERSITY");
        body.add("language", "ENGLISH");
        body.add("crop", "blackgram");
        body.add("topic", "CROP_MANAGEMENT");
        body.add("authority", "TNAU Agronomy");
        body.add("version", "2026");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(adminToken);
        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        // 1. Upload Document (Tests A, L)
        ResponseEntity<String> uploadResponse = restTemplate.postForEntity(getBaseUrl() + "/documents", request, String.class);
        assertThat(uploadResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        JsonNode root = objectMapper.readTree(uploadResponse.getBody());
        JsonNode data = root.get("data");
        assertThat(data).isNotNull();

        UUID docId = UUID.fromString(data.get("documentId").asText());
        assertThat(data.get("title").asText()).isEqualTo("IngestTest - TNAU Blackgram Guide 2026");
        assertThat(data.get("status").asText()).isEqualTo("DRAFT");
        assertThat(data.get("ingestionStatus").asText()).isEqualTo("INGESTED");
        int chunkCount = data.get("chunkCount").asInt();
        int vectorCount = data.get("vectorCount").asInt();
        assertThat(chunkCount).isGreaterThan(0);
        assertThat(vectorCount).isEqualTo(chunkCount); // Parity maintained! (Test T)
        String storagePath = data.get("storagePath").asText();
        assertThat(storagePath).contains("blackgram_guide_2026.pdf");

        // 2. Verify PostgreSQL metadata exists (Test Q)
        KnowledgeDocument savedDoc = documentRepository.findById(docId).orElse(null);
        assertThat(savedDoc).isNotNull();
        assertThat(savedDoc.getTitle()).isEqualTo("IngestTest - TNAU Blackgram Guide 2026");
        assertThat(savedDoc.getStatus()).isEqualTo(DocumentStatus.DRAFT);

        // 3. Verify MinIO object exists (Test P)
        assertThat(storageService.documentExists(storagePath)).isTrue();

        // 4. Verify Chunks exist (Test R)
        List<KnowledgeChunk> chunks = chunkRepository.findByDocument_IdOrderByChunkIndexAsc(docId);
        assertThat(chunks).hasSize(chunkCount);

        // 5. Verify Vectors exist in PgVectorStore with status = DRAFT (Test S)
        Integer dbVectorCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM vector_store WHERE metadata->>'knowledgeDocumentId' = ?",
                Integer.class,
                docId.toString()
        );
        assertThat(dbVectorCount).isEqualTo(chunkCount);

        String vectorStatus = jdbcTemplate.queryForObject(
                "SELECT metadata->>'status' FROM vector_store WHERE metadata->>'knowledgeDocumentId' = ? LIMIT 1",
                String.class,
                docId.toString()
        );
        assertThat(vectorStatus).isEqualTo("DRAFT");

        // 6. Test M: Verify newly ingested DRAFT is EXCLUDED from RAG retrieval
        List<KnowledgeRetrievalResult> draftRagResults = retrievalService.search(
                KnowledgeRetrievalRequest.builder()
                        .query("Rhizobium biofertilizer inoculation recommended for blackgram")
                        .topK(10)
                        .crop("blackgram")
                        .build()
        );
        boolean draftFoundInRag = draftRagResults.stream()
                .anyMatch(r -> docId.toString().equals(r.getKnowledgeDocumentId()));
        assertThat(draftFoundInRag).as("Newly ingested DRAFT document must be EXCLUDED from RAG retrieval").isFalse();

        // 7. Test N: Activate document and verify INCLUDED in RAG
        HttpHeaders authHeaders = new HttpHeaders();
        authHeaders.setBearerAuth(adminToken);
        ResponseEntity<String> activateResponse = restTemplate.exchange(
                getBaseUrl() + "/" + docId + "/activate",
                HttpMethod.POST,
                new HttpEntity<>(authHeaders),
                String.class
        );
        assertThat(activateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Verify status updated to ACTIVE in vector_store
        String activeVectorStatus = jdbcTemplate.queryForObject(
                "SELECT metadata->>'status' FROM vector_store WHERE metadata->>'knowledgeDocumentId' = ? LIMIT 1",
                String.class,
                docId.toString()
        );
        assertThat(activeVectorStatus).isEqualTo("ACTIVE");

        List<KnowledgeRetrievalResult> activeRagResults = retrievalService.search(
                KnowledgeRetrievalRequest.builder()
                        .query("Rhizobium biofertilizer inoculation recommended for blackgram")
                        .topK(10)
                        .crop("blackgram")
                        .build()
        );
        boolean activeFoundInRag = activeRagResults.stream()
                .anyMatch(r -> docId.toString().equals(r.getKnowledgeDocumentId()));
        assertThat(activeFoundInRag).as("Activated document MUST be retrieved by RAG").isTrue();

        // 8. Test O: Archive document and verify EXCLUDED from RAG
        ResponseEntity<String> archiveResponse = restTemplate.exchange(
                getBaseUrl() + "/" + docId + "/archive",
                HttpMethod.POST,
                new HttpEntity<>(authHeaders),
                String.class
        );
        assertThat(archiveResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        List<KnowledgeRetrievalResult> archivedRagResults = retrievalService.search(
                KnowledgeRetrievalRequest.builder()
                        .query("Rhizobium biofertilizer inoculation recommended for blackgram")
                        .topK(10)
                        .crop("blackgram")
                        .build()
        );
        boolean archivedFoundInRag = archivedRagResults.stream()
                .anyMatch(r -> docId.toString().equals(r.getKnowledgeDocumentId()));
        assertThat(archivedFoundInRag).as("Archived document must be EXCLUDED from RAG retrieval").isFalse();

        // 9. Provenance preservation: doc, chunks, vectors, and MinIO storage remain intact
        assertThat(documentRepository.existsById(docId)).isTrue();
        assertThat(chunkRepository.countByDocument_Id(docId)).isEqualTo(chunkCount);
        assertThat(storageService.documentExists(storagePath)).isTrue();
        Integer finalVectorCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM vector_store WHERE metadata->>'knowledgeDocumentId' = ?",
                Integer.class,
                docId.toString()
        );
        assertThat(finalVectorCount).isEqualTo(chunkCount);
    }

    @Test
    @Order(4)
    @DisplayName("Test B: Upload DOCX successfully")
    void testUploadDocx_Success() throws Exception {
        byte[] docxBytes = createSampleDocx("IngestTest DOCX: Recommended phosphorus fertilizer for red gram pulse crop cultivation.");

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", createPart(docxBytes, "redgram_protocol.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
        body.add("title", "IngestTest - Redgram Protocol 2026");
        body.add("source", "ICAR");
        body.add("sourceType", "RESEARCH_INSTITUTION");
        body.add("language", "ENGLISH");
        body.add("crop", "redgram");
        body.add("topic", "NUTRIENT_MANAGEMENT");
        body.add("version", "2026");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(adminToken);
        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(getBaseUrl() + "/documents", request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        JsonNode root = objectMapper.readTree(response.getBody());
        assertThat(root.get("data").get("ingestionStatus").asText()).isEqualTo("INGESTED");
        assertThat(root.get("data").get("chunkCount").asInt()).isGreaterThan(0);
        assertThat(root.get("data").get("status").asText()).isEqualTo("DRAFT");
    }

    @Test
    @Order(5)
    @DisplayName("Test C: Upload TXT successfully")
    void testUploadTxt_Success() {
        byte[] txtBytes = "IngestTest TXT: Drip irrigation schedule for groundnut farming during summer season.".getBytes(StandardCharsets.UTF_8);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", createPart(txtBytes, "groundnut_irrigation.txt", "text/plain"));
        body.add("title", "IngestTest - Groundnut Irrigation Guide");
        body.add("source", "TNAU");
        body.add("sourceType", "AGRICULTURAL_UNIVERSITY");
        body.add("language", "ENGLISH");
        body.add("crop", "groundnut");
        body.add("topic", "IRRIGATION");
        body.add("version", "2026");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(adminToken);
        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(getBaseUrl() + "/documents", request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        JsonNode root;
        try {
            root = objectMapper.readTree(response.getBody());
            assertThat(root.get("data").get("ingestionStatus").asText()).isEqualTo("INGESTED");
            assertThat(root.get("data").get("chunkCount").asInt()).isGreaterThan(0);
            assertThat(root.get("data").get("status").asText()).isEqualTo("DRAFT");
        } catch (Exception e) {
            Assertions.fail(e.getMessage());
        }
    }

    @Test
    @Order(6)
    @DisplayName("Test D: Unsupported file rejected with 400 Bad Request")
    void testUpload_UnsupportedFile_Rejected() {
        byte[] exeBytes = "MZ executable binary content".getBytes(StandardCharsets.UTF_8);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", createPart(exeBytes, "exploit.exe", "application/x-msdownload"));
        body.add("title", "IngestTest - Unsupported Binary");
        body.add("sourceType", "GOVERNMENT_SCHEMES");
        body.add("language", "ENGLISH");
        body.add("topic", "CROP_MANAGEMENT");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(adminToken);
        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(getBaseUrl() + "/documents", request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @Order(7)
    @DisplayName("Test E: Empty file rejected with 400 Bad Request")
    void testUpload_EmptyFile_Rejected() {
        byte[] emptyBytes = new byte[0];

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", createPart(emptyBytes, "empty.pdf", "application/pdf"));
        body.add("title", "IngestTest - Empty Document");
        body.add("sourceType", "AGRICULTURAL_UNIVERSITY");
        body.add("language", "ENGLISH");
        body.add("topic", "CROP_MANAGEMENT");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(adminToken);
        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(getBaseUrl() + "/documents", request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @Order(8)
    @DisplayName("Test F: Invalid metadata rejected with 400 Bad Request")
    void testUpload_InvalidMetadata_Rejected() throws Exception {
        byte[] pdfBytes = createSamplePdf("Valid agricultural text content");

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", createPart(pdfBytes, "valid.pdf", "application/pdf"));
        // Missing title!
        body.add("sourceType", "AGRICULTURAL_UNIVERSITY");
        body.add("language", "ENGLISH");
        body.add("topic", "CROP_MANAGEMENT");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(adminToken);
        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(getBaseUrl() + "/documents", request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @Order(9)
    @DisplayName("Test G: Duplicate document rejected with 400 Bad Request without storing duplicate data")
    void testUpload_DuplicateDocument_Rejected() throws Exception {
        byte[] pdfBytes = createSamplePdf("IngestTest Duplicate Content: Organic paddy cultivation guide.");

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", createPart(pdfBytes, "duplicate_test.pdf", "application/pdf"));
        body.add("title", "IngestTest - Duplicate Prevention Document");
        body.add("source", "TNAU");
        body.add("sourceType", "AGRICULTURAL_UNIVERSITY");
        body.add("language", "ENGLISH");
        body.add("topic", "CROP_MANAGEMENT");
        body.add("version", "2026");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(adminToken);
        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        // First upload succeeds
        ResponseEntity<String> firstResponse = restTemplate.postForEntity(getBaseUrl() + "/documents", request, String.class);
        assertThat(firstResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // Second upload with same (title, version, source) must be rejected
        ResponseEntity<String> duplicateResponse = restTemplate.postForEntity(getBaseUrl() + "/documents", request, String.class);
        assertThat(duplicateResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        JsonNode root = objectMapper.readTree(duplicateResponse.getBody());
        assertThat(root.get("error").get("message").asText()).contains("Duplicate document rejected");

        // Verify only 1 document entity exists
        List<KnowledgeDocument> matches = documentRepository.findAll(
                (r, q, cb) -> cb.equal(r.get("title"), "IngestTest - Duplicate Prevention Document"));
        assertThat(matches).hasSize(1);
    }

    @Test
    @Order(10)
    @DisplayName("Test H: Legitimate new version accepted independently")
    void testUpload_NewVersion_AcceptedIndependently() throws Exception {
        byte[] pdfBytesV1 = createSamplePdf("Rice production protocol version 2024.");
        byte[] pdfBytesV2 = createSamplePdf("Rice production protocol updated version 2026 with new hybrid varieties.");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(adminToken);

        // Upload version 2024
        MultiValueMap<String, Object> bodyV1 = new LinkedMultiValueMap<>();
        bodyV1.add("file", createPart(pdfBytesV1, "rice_2024.pdf", "application/pdf"));
        bodyV1.add("title", "IngestTest - Rice Production Protocol");
        bodyV1.add("source", "TNAU");
        bodyV1.add("sourceType", "AGRICULTURAL_UNIVERSITY");
        bodyV1.add("language", "ENGLISH");
        bodyV1.add("topic", "CROP_MANAGEMENT");
        bodyV1.add("version", "2024");

        ResponseEntity<String> respV1 = restTemplate.postForEntity(getBaseUrl() + "/documents",
                new HttpEntity<>(bodyV1, headers), String.class);
        assertThat(respV1.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        UUID idV1 = UUID.fromString(objectMapper.readTree(respV1.getBody()).get("data").get("documentId").asText());

        // Upload new version 2026 with same title and source
        MultiValueMap<String, Object> bodyV2 = new LinkedMultiValueMap<>();
        bodyV2.add("file", createPart(pdfBytesV2, "rice_2026.pdf", "application/pdf"));
        bodyV2.add("title", "IngestTest - Rice Production Protocol");
        bodyV2.add("source", "TNAU");
        bodyV2.add("sourceType", "AGRICULTURAL_UNIVERSITY");
        bodyV2.add("language", "ENGLISH");
        bodyV2.add("topic", "CROP_MANAGEMENT");
        bodyV2.add("version", "2026");

        ResponseEntity<String> respV2 = restTemplate.postForEntity(getBaseUrl() + "/documents",
                new HttpEntity<>(bodyV2, headers), String.class);
        assertThat(respV2.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        UUID idV2 = UUID.fromString(objectMapper.readTree(respV2.getBody()).get("data").get("documentId").asText());

        // Both versions must exist independently
        assertThat(idV1).isNotEqualTo(idV2);
        assertThat(documentRepository.existsById(idV1)).isTrue();
        assertThat(documentRepository.existsById(idV2)).isTrue();
    }

    @Test
    @Order(11)
    @DisplayName("Test I: Corrupted text extraction failure handled safely without creating active knowledge")
    void testUpload_ExtractionFailure_HandledSafely() {
        // Plain text with only whitespace or non-extractable content
        byte[] emptyText = "     \n\n\t   ".getBytes(StandardCharsets.UTF_8);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", createPart(emptyText, "blank.txt", "text/plain"));
        body.add("title", "IngestTest - Blank Text Document");
        body.add("sourceType", "AGRICULTURAL_UNIVERSITY");
        body.add("language", "ENGLISH");
        body.add("topic", "CROP_MANAGEMENT");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(adminToken);
        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(getBaseUrl() + "/documents", request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // Verify no active document was created
        List<KnowledgeDocument> docs = documentRepository.findAll(
                (r, q, cb) -> cb.equal(r.get("title"), "IngestTest - Blank Text Document"));
        assertThat(docs).isEmpty();
    }
}
