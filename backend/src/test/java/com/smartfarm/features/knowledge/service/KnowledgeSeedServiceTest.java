package com.smartfarm.features.knowledge.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.smartfarm.features.knowledge.config.KnowledgeSeedProperties;
import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionResult;
import com.smartfarm.features.knowledge.dto.KnowledgeSeedItem;
import com.smartfarm.features.knowledge.dto.KnowledgeSeedManifest;
import com.smartfarm.features.knowledge.dto.KnowledgeSeedResult;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class KnowledgeSeedServiceTest {

    @Mock
    private DocumentIngestionOrchestrator orchestrator;

    @Mock
    private KnowledgeDocumentRepository documentRepository;

    @Mock
    private ResourceLoader resourceLoader;

    private ObjectMapper objectMapper;
    private KnowledgeSeedProperties properties;
    private KnowledgeSeedService seedService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        properties = new KnowledgeSeedProperties();
        properties.setLocation("classpath:knowledge-seed/");
        properties.setManifestFile("manifest.json");

        seedService = new KnowledgeSeedService(
                orchestrator,
                documentRepository,
                properties,
                resourceLoader,
                objectMapper
        );
    }

    @Test
    @DisplayName("When manifest file does not exist, return 0 processed gracefully")
    void testManifestDoesNotExist() {
        Resource mockResource = org.mockito.Mockito.mock(Resource.class);
        when(mockResource.exists()).thenReturn(false);
        when(resourceLoader.getResource("classpath:knowledge-seed/manifest.json")).thenReturn(mockResource);

        KnowledgeSeedResult result = seedService.seedFromConfiguredLocation();

        assertThat(result.getProcessed()).isEqualTo(0);
        assertThat(result.getInserted()).isEqualTo(0);
        assertThat(result.getSkipped()).isEqualTo(0);
        assertThat(result.getFailed()).isEqualTo(0);
        assertThat(result.getFailures()).isEmpty();
    }

    @Test
    @DisplayName("When manifest contains empty documents list, return 0 processed gracefully")
    void testEmptyManifest() {
        String json = "{\"documents\": []}";
        Resource mockResource = new ByteArrayResource(json.getBytes(StandardCharsets.UTF_8));
        when(resourceLoader.getResource("classpath:knowledge-seed/manifest.json")).thenReturn(mockResource);

        KnowledgeSeedResult result = seedService.seedFromConfiguredLocation();

        assertThat(result.getProcessed()).isEqualTo(0);
        assertThat(result.getInserted()).isEqualTo(0);
        assertThat(result.getSkipped()).isEqualTo(0);
        assertThat(result.getFailed()).isEqualTo(0);
    }

    @Test
    @DisplayName("Valid seed document is stored and ingested with metadata preserved")
    void testValidSeedDocument() throws Exception {
        KnowledgeSeedItem item = KnowledgeSeedItem.builder()
                .filePath("tnau/paddy-manual.pdf")
                .title("TNAU Rice Production Manual")
                .source("Tamil Nadu Agricultural University")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Paddy")
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .authority("Directorate of Extension Education")
                .version("2024.1")
                .publishedDate(LocalDate.of(2024, 1, 15))
                .lastVerifiedAt(OffsetDateTime.parse("2026-01-01T00:00:00Z"))
                .sourceUrl("https://agritech.tnau.ac.in")
                .status(DocumentStatus.ACTIVE)
                .metadata("{\"verified\": true}")
                .build();

        KnowledgeSeedManifest manifest = new KnowledgeSeedManifest(List.of(item));
        byte[] docBytes = "%PDF-1.4 test pdf content".getBytes(StandardCharsets.UTF_8);

        when(documentRepository.findAll(any(Specification.class))).thenReturn(List.of());

        Resource docResource = new ByteArrayResource(docBytes) {
            @Override
            public String getFilename() {
                return "paddy-manual.pdf";
            }
        };
        when(resourceLoader.getResource("classpath:knowledge-seed/tnau/paddy-manual.pdf")).thenReturn(docResource);

        KnowledgeIngestionResult mockIngestionResult = KnowledgeIngestionResult.builder()
                .documentId(UUID.randomUUID())
                .title(item.getTitle())
                .status(DocumentStatus.ACTIVE)
                .chunkCount(5)
                .vectorCount(5)
                .outcome("SUCCESS")
                .build();

        when(orchestrator.storeAndIngest(any(), eq("paddy-manual.pdf"), eq("application/pdf"), eq(docBytes), any()))
                .thenReturn(mockIngestionResult);

        KnowledgeSeedResult result = seedService.seedManifest(manifest, "classpath:knowledge-seed/");

        assertThat(result.getProcessed()).isEqualTo(1);
        assertThat(result.getInserted()).isEqualTo(1);
        assertThat(result.getSkipped()).isEqualTo(0);
        assertThat(result.getFailed()).isEqualTo(0);
        assertThat(result.getFailures()).isEmpty();

        ArgumentCaptor<KnowledgeIngestionRequest> reqCaptor = ArgumentCaptor.forClass(KnowledgeIngestionRequest.class);
        verify(orchestrator).storeAndIngest(any(), eq("paddy-manual.pdf"), eq("application/pdf"), eq(docBytes), reqCaptor.capture());

        KnowledgeIngestionRequest req = reqCaptor.getValue();
        assertThat(req.getTitle()).isEqualTo("TNAU Rice Production Manual");
        assertThat(req.getSource()).isEqualTo("Tamil Nadu Agricultural University");
        assertThat(req.getSourceType()).isEqualTo(SourceType.AGRICULTURAL_UNIVERSITY);
        assertThat(req.getLanguage()).isEqualTo(KnowledgeLanguage.ENGLISH);
        assertThat(req.getCrop()).isEqualTo("Paddy");
        assertThat(req.getTopic()).isEqualTo(KnowledgeTopic.CROP_MANAGEMENT);
        assertThat(req.getAuthority()).isEqualTo("Directorate of Extension Education");
        assertThat(req.getVersion()).isEqualTo("2024.1");
        assertThat(req.getPublishedDate()).isEqualTo(LocalDate.of(2024, 1, 15));
        assertThat(req.getStatus()).isEqualTo(DocumentStatus.ACTIVE);
    }

    @Test
    @DisplayName("Idempotency: When document already exists in repository, skip without calling orchestrator")
    void testIdempotencySkipped() {
        KnowledgeSeedItem item = KnowledgeSeedItem.builder()
                .filePath("icar/soil-health.docx")
                .title("ICAR Soil Health Management")
                .source("ICAR")
                .sourceType(SourceType.RESEARCH_INSTITUTION)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.SOIL)
                .version("1.0")
                .build();

        KnowledgeSeedManifest manifest = new KnowledgeSeedManifest(List.of(item));

        KnowledgeDocument existingDoc = KnowledgeDocument.builder()
                .id(UUID.randomUUID())
                .title("ICAR Soil Health Management")
                .version("1.0")
                .source("ICAR")
                .build();

        when(documentRepository.findAll(any(Specification.class))).thenReturn(List.of(existingDoc));

        KnowledgeSeedResult result = seedService.seedManifest(manifest, "classpath:knowledge-seed/");

        assertThat(result.getProcessed()).isEqualTo(1);
        assertThat(result.getInserted()).isEqualTo(0);
        assertThat(result.getSkipped()).isEqualTo(1);
        assertThat(result.getFailed()).isEqualTo(0);
        assertThat(result.getFailures()).isEmpty();

        verify(orchestrator, never()).storeAndIngest(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Validation failure: Missing required fields (title, topic, language, sourceType, filePath) records failure")
    void testValidationFailureMissingRequiredFields() {
        KnowledgeSeedItem missingTitle = KnowledgeSeedItem.builder()
                .filePath("tnau/doc.txt")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.GENERAL_FARMING)
                .build();

        KnowledgeSeedItem missingTopic = KnowledgeSeedItem.builder()
                .filePath("tnau/doc2.txt")
                .title("Valid Title")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.ENGLISH)
                .build();

        KnowledgeSeedItem missingFilePath = KnowledgeSeedItem.builder()
                .title("Valid Title")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.GENERAL_FARMING)
                .build();

        KnowledgeSeedManifest manifest = new KnowledgeSeedManifest(List.of(missingTitle, missingTopic, missingFilePath));

        KnowledgeSeedResult result = seedService.seedManifest(manifest, "classpath:knowledge-seed/");

        assertThat(result.getProcessed()).isEqualTo(3);
        assertThat(result.getInserted()).isEqualTo(0);
        assertThat(result.getSkipped()).isEqualTo(0);
        assertThat(result.getFailed()).isEqualTo(3);
        assertThat(result.getFailures()).hasSize(3);
        assertThat(result.getFailures().get(0).getReason()).contains("title is required");
        assertThat(result.getFailures().get(1).getReason()).contains("topic is required");
        assertThat(result.getFailures().get(2).getReason()).contains("filePath is required");
    }

    @Test
    @DisplayName("Unsupported file format (.exe) is rejected and recorded as failure")
    void testUnsupportedFileFormat() {
        KnowledgeSeedItem item = KnowledgeSeedItem.builder()
                .filePath("government/installer.exe")
                .title("Agriculture App")
                .sourceType(SourceType.GOVERNMENT)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.GENERAL_FARMING)
                .build();

        KnowledgeSeedManifest manifest = new KnowledgeSeedManifest(List.of(item));
        when(documentRepository.findAll(any(Specification.class))).thenReturn(List.of());

        Resource docResource = new ByteArrayResource(new byte[]{1, 2, 3});
        when(resourceLoader.getResource("classpath:knowledge-seed/government/installer.exe")).thenReturn(docResource);

        KnowledgeSeedResult result = seedService.seedManifest(manifest, "classpath:knowledge-seed/");

        assertThat(result.getProcessed()).isEqualTo(1);
        assertThat(result.getInserted()).isEqualTo(0);
        assertThat(result.getSkipped()).isEqualTo(0);
        assertThat(result.getFailed()).isEqualTo(1);
        assertThat(result.getFailures().get(0).getReason()).contains("Unsupported file format");
    }

    @Test
    @DisplayName("Empty file (0 bytes) is rejected with clear failure")
    void testEmptyFileFailure() {
        KnowledgeSeedItem item = KnowledgeSeedItem.builder()
                .filePath("government/empty.txt")
                .title("Empty Guidelines")
                .sourceType(SourceType.GOVERNMENT)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.GENERAL_FARMING)
                .build();

        KnowledgeSeedManifest manifest = new KnowledgeSeedManifest(List.of(item));
        when(documentRepository.findAll(any(Specification.class))).thenReturn(List.of());

        Resource docResource = new ByteArrayResource(new byte[0]);
        when(resourceLoader.getResource("classpath:knowledge-seed/government/empty.txt")).thenReturn(docResource);

        KnowledgeSeedResult result = seedService.seedManifest(manifest, "classpath:knowledge-seed/");

        assertThat(result.getProcessed()).isEqualTo(1);
        assertThat(result.getInserted()).isEqualTo(0);
        assertThat(result.getSkipped()).isEqualTo(0);
        assertThat(result.getFailed()).isEqualTo(1);
        assertThat(result.getFailures().get(0).getReason()).contains("Document file is empty");
    }

    @Test
    @DisplayName("Missing document file records failure")
    void testFileNotFoundFailure() {
        KnowledgeSeedItem item = KnowledgeSeedItem.builder()
                .filePath("kvk/missing.pdf")
                .title("Missing Advisory")
                .sourceType(SourceType.EXTENSION_SERVICE)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.PEST_MANAGEMENT)
                .build();

        KnowledgeSeedManifest manifest = new KnowledgeSeedManifest(List.of(item));
        when(documentRepository.findAll(any(Specification.class))).thenReturn(List.of());

        Resource mockResource = org.mockito.Mockito.mock(Resource.class);
        when(mockResource.exists()).thenReturn(false);
        when(resourceLoader.getResource("classpath:knowledge-seed/kvk/missing.pdf")).thenReturn(mockResource);

        KnowledgeSeedResult result = seedService.seedManifest(manifest, "classpath:knowledge-seed/");

        assertThat(result.getProcessed()).isEqualTo(1);
        assertThat(result.getInserted()).isEqualTo(0);
        assertThat(result.getSkipped()).isEqualTo(0);
        assertThat(result.getFailed()).isEqualTo(1);
        assertThat(result.getFailures().get(0).getReason()).contains("Document file not found");
    }

    @Test
    @DisplayName("Orchestrator failure is caught and recorded in failures list")
    void testOrchestratorException() {
        KnowledgeSeedItem item = KnowledgeSeedItem.builder()
                .filePath("tnau/corrupt.pdf")
                .title("Corrupt PDF")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .build();

        KnowledgeSeedManifest manifest = new KnowledgeSeedManifest(List.of(item));
        when(documentRepository.findAll(any(Specification.class))).thenReturn(List.of());

        Resource docResource = new ByteArrayResource("not a real pdf".getBytes(StandardCharsets.UTF_8));
        when(resourceLoader.getResource("classpath:knowledge-seed/tnau/corrupt.pdf")).thenReturn(docResource);

        when(orchestrator.storeAndIngest(any(), any(), any(), any(), any()))
                .thenThrow(new IllegalStateException("Failed to extract text from corrupt document"));

        KnowledgeSeedResult result = seedService.seedManifest(manifest, "classpath:knowledge-seed/");

        assertThat(result.getProcessed()).isEqualTo(1);
        assertThat(result.getInserted()).isEqualTo(0);
        assertThat(result.getSkipped()).isEqualTo(0);
        assertThat(result.getFailed()).isEqualTo(1);
        assertThat(result.getFailures().get(0).getReason()).contains("Failed to extract text");
    }

    @Test
    @DisplayName("Production manifest.json parses cleanly and references valid files")
    void testProductionManifestFileStructureAndValidity() throws Exception {
        java.io.File manifestFile = new java.io.File("src/main/resources/knowledge-seed/manifest.json");
        assertThat(manifestFile).exists();

        KnowledgeSeedManifest manifest = objectMapper.readValue(manifestFile, KnowledgeSeedManifest.class);
        assertThat(manifest.getDocuments()).hasSize(5);

        for (KnowledgeSeedItem item : manifest.getDocuments()) {
            assertThat(item.getTitle()).isNotBlank();
            assertThat(item.getFilePath()).isNotBlank();
            assertThat(item.getSourceType()).isNotNull();
            assertThat(item.getLanguage()).isNotNull();
            assertThat(item.getTopic()).isNotNull();
            assertThat(item.getStatus()).isEqualTo(DocumentStatus.ACTIVE);

            java.io.File physicalFile = new java.io.File("src/main/resources/knowledge-seed", item.getFilePath());
            assertThat(physicalFile).exists();
            assertThat(physicalFile.length()).isGreaterThan(0);
        }
    }
}
