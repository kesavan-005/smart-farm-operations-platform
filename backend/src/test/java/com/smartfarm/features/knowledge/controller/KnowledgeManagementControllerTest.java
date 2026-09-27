package com.smartfarm.features.knowledge.controller;

import com.smartfarm.common.exception.GlobalExceptionHandler;
import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.dto.*;
import com.smartfarm.features.knowledge.exception.KnowledgeLifecycleException;
import com.smartfarm.features.knowledge.service.KnowledgeHealthService;
import com.smartfarm.features.knowledge.service.KnowledgeManagementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.mock.web.MockMultipartFile;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Phase 2.7 - Knowledge Management Controller Unit Tests")
class KnowledgeManagementControllerTest {

    private MockMvc mockMvc;
    private KnowledgeManagementController controller;
    private KnowledgeManagementService managementService;
    private KnowledgeHealthService healthService;

    private UUID docId;
    private KnowledgeDocumentSummaryDto summaryDto;
    private KnowledgeDocumentDetailDto detailDto;
    private KnowledgeDocumentUploadResponse uploadResponse;
    private KnowledgeHealthReportDto healthReport;

    private boolean notFound = false;
    private boolean safetyFail = false;

    @BeforeEach
    void setUp() {
        notFound = false;
        safetyFail = false;
        docId = UUID.randomUUID();

        summaryDto = KnowledgeDocumentSummaryDto.builder()
                .id(docId)
                .title("Test Agricultural Document")
                .source("TNAU")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .authority("TNAU Agronomy")
                .language(KnowledgeLanguage.ENGLISH)
                .crop("blackgram")
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .version("1.0")
                .status(DocumentStatus.ACTIVE)
                .chunkCount(10)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        detailDto = KnowledgeDocumentDetailDto.builder()
                .id(docId)
                .title("Test Agricultural Document")
                .source("TNAU")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .authority("TNAU Agronomy")
                .language(KnowledgeLanguage.ENGLISH)
                .crop("blackgram")
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .version("1.0")
                .status(DocumentStatus.ACTIVE)
                .originalFilename("test.pdf")
                .contentType("application/pdf")
                .fileSizeBytes(1024L)
                .storagePath("knowledge/test.pdf")
                .chunkCount(10)
                .vectorCount(10)
                .fileInStorage(true)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        uploadResponse = KnowledgeDocumentUploadResponse.builder()
                .documentId(docId)
                .title("Test Agricultural Document")
                .source("TNAU")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .authority("TNAU Agronomy")
                .language(KnowledgeLanguage.ENGLISH)
                .crop("blackgram")
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .version("1.0")
                .status(DocumentStatus.DRAFT)
                .originalFilename("test.pdf")
                .contentType("application/pdf")
                .fileSizeBytes(1024L)
                .storagePath("knowledge/" + docId + "/test.pdf")
                .chunkCount(5)
                .vectorCount(5)
                .ingestionStatus("INGESTED")
                .createdAt(OffsetDateTime.now())
                .build();

        healthReport = KnowledgeHealthReportDto.builder()
                .healthy(true)
                .activeDocuments(5)
                .draftDocuments(0)
                .archivedDocuments(0)
                .totalDocuments(5)
                .totalChunks(5291)
                .totalVectors(5291)
                .chunksWithoutVectorsCount(0)
                .orphanVectorsCount(0)
                .activeDocumentsWithZeroChunksCount(0)
                .documentsWithMissingStorageFileCount(0)
                .documentsWithInvalidIndexingStateCount(0)
                .duplicateDocumentIdentitiesCount(0)
                .documentsWithInvalidMetadataCount(0)
                .build();

        managementService = new KnowledgeManagementService(null, null, null, null, null) {
            @Override
            public KnowledgeDocumentUploadResponse uploadDocument(KnowledgeDocumentUploadRequest request) {
                if (safetyFail) {
                    throw new KnowledgeLifecycleException("Duplicate document rejected: Document already exists");
                }
                return uploadResponse;
            }

            @Override
            public Page<KnowledgeDocumentSummaryDto> listDocuments(KnowledgeDocumentFilter filter, Pageable pageable) {
                return new PageImpl<>(List.of(summaryDto), org.springframework.data.domain.PageRequest.of(0, 20), 1);
            }

            @Override
            public Page<KnowledgeDocumentSummaryDto> searchDocuments(String query, KnowledgeDocumentFilter filter, Pageable pageable) {
                return new PageImpl<>(List.of(summaryDto), org.springframework.data.domain.PageRequest.of(0, 20), 1);
            }

            @Override
            public KnowledgeDocumentDetailDto getDocumentDetails(UUID id) {
                if (notFound) {
                    throw new ResourceNotFoundException("Knowledge document not found");
                }
                return detailDto;
            }

            @Override
            public KnowledgeDocumentDetailDto activateDocument(UUID id) {
                if (safetyFail) {
                    throw new KnowledgeLifecycleException("Document cannot be activated: 0 chunks");
                }
                return detailDto;
            }

            @Override
            public KnowledgeDocumentDetailDto archiveDocument(UUID id) {
                return KnowledgeDocumentDetailDto.builder()
                        .id(docId)
                        .title("Test Agricultural Document")
                        .status(DocumentStatus.ARCHIVED)
                        .build();
            }
        };

        healthService = new KnowledgeHealthService(null, null, null, null) {
            @Override
            public KnowledgeHealthReportDto generateHealthReport() {
                return healthReport;
            }
        };

        controller = new KnowledgeManagementController(managementService, healthService);

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/knowledge - Returns paged document summaries")
    void listDocuments_ReturnsPagedSummaries() throws Exception {
        mockMvc.perform(get("/api/v1/knowledge")
                        .param("source", "TNAU")
                        .param("status", "ACTIVE")
                        .param("page", "0")
                        .param("size", "20")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(docId.toString()))
                .andExpect(jsonPath("$.data.content[0].title").value("Test Agricultural Document"))
                .andExpect(jsonPath("$.data.content[0].source").value("TNAU"))
                .andExpect(jsonPath("$.data.content[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.content[0].chunkCount").value(10));
    }

    @Test
    @DisplayName("GET /api/v1/knowledge/{id} - Returns document details")
    void getDocumentDetail_Success() throws Exception {
        mockMvc.perform(get("/api/v1/knowledge/{id}", docId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(docId.toString()))
                .andExpect(jsonPath("$.data.title").value("Test Agricultural Document"))
                .andExpect(jsonPath("$.data.originalFilename").value("test.pdf"))
                .andExpect(jsonPath("$.data.fileInStorage").value(true))
                .andExpect(jsonPath("$.data.vectorCount").value(10));
    }

    @Test
    @DisplayName("GET /api/v1/knowledge/{id} - Returns 404 when document not found")
    void getDocumentDetail_NotFound() throws Exception {
        notFound = true;

        mockMvc.perform(get("/api/v1/knowledge/{id}", docId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/v1/knowledge/search - Returns search results with query parameter")
    void searchDocuments_ReturnsMatches() throws Exception {
        mockMvc.perform(get("/api/v1/knowledge/search")
                        .param("q", "blackgram")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].crop").value("blackgram"));
    }

    @Test
    @DisplayName("POST /api/v1/knowledge/{id}/activate - Successfully activates document")
    void activateDocument_Success() throws Exception {
        mockMvc.perform(post("/api/v1/knowledge/{id}/activate", docId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("POST /api/v1/knowledge/{id}/activate - Fails with 400 when activation safety check fails")
    void activateDocument_SafetyFailure_Returns400() throws Exception {
        safetyFail = true;

        mockMvc.perform(post("/api/v1/knowledge/{id}/activate", docId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message").value("Document cannot be activated: 0 chunks"));
    }

    @Test
    @DisplayName("POST /api/v1/knowledge/{id}/archive - Successfully archives document")
    void archiveDocument_Success() throws Exception {
        mockMvc.perform(post("/api/v1/knowledge/{id}/archive", docId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ARCHIVED"));
    }

    @Test
    @DisplayName("GET /api/v1/knowledge/health - Returns knowledge health diagnostic report")
    void getHealthReport_Success() throws Exception {
        mockMvc.perform(get("/api/v1/knowledge/health")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.healthy").value(true))
                .andExpect(jsonPath("$.data.activeDocuments").value(5))
                .andExpect(jsonPath("$.data.totalChunks").value(5291))
                .andExpect(jsonPath("$.data.totalVectors").value(5291))
                .andExpect(jsonPath("$.data.chunksWithoutVectorsCount").value(0))
                .andExpect(jsonPath("$.data.orphanVectorsCount").value(0));
    }

    @Test
    @DisplayName("POST /api/v1/knowledge/documents - Successfully uploads and ingests document")
    void uploadDocument_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "%PDF-1.4 test agricultural guide".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/knowledge/documents")
                        .file(file)
                        .param("title", "Test Agricultural Document")
                        .param("source", "TNAU")
                        .param("sourceType", "AGRICULTURAL_UNIVERSITY")
                        .param("language", "ENGLISH")
                        .param("crop", "blackgram")
                        .param("topic", "CROP_MANAGEMENT")
                        .param("version", "1.0"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.documentId").value(docId.toString()))
                .andExpect(jsonPath("$.data.title").value("Test Agricultural Document"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.ingestionStatus").value("INGESTED"))
                .andExpect(jsonPath("$.data.chunkCount").value(5))
                .andExpect(jsonPath("$.data.vectorCount").value(5));
    }

    @Test
    @DisplayName("POST /api/v1/knowledge/documents - Duplicate document rejected with 400 Bad Request")
    void uploadDocument_DuplicateRejected() throws Exception {
        safetyFail = true;

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "%PDF-1.4 test agricultural guide".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/knowledge/documents")
                        .file(file)
                        .param("title", "Test Agricultural Document")
                        .param("source", "TNAU")
                        .param("sourceType", "AGRICULTURAL_UNIVERSITY")
                        .param("language", "ENGLISH")
                        .param("crop", "blackgram")
                        .param("topic", "CROP_MANAGEMENT")
                        .param("version", "1.0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message").value("Duplicate document rejected: Document already exists"));
    }
}
