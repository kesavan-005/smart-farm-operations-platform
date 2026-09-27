package com.smartfarm.features.knowledge.service;

import com.smartfarm.common.exception.BadRequestException;
import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionResult;
import com.smartfarm.features.knowledge.extractor.DocumentTextExtractor;
import com.smartfarm.features.knowledge.storage.DocumentStorageService;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Phase 2.3 - Document Ingestion Orchestrator Unit Tests")
class DocumentIngestionOrchestratorTest {

    @Mock
    private DocumentStorageService storageService;

    @Mock
    private DocumentTextExtractor textExtractor;

    @Mock
    private KnowledgeIngestionService ingestionService;

    private DocumentIngestionOrchestrator orchestrator;

    @BeforeEach
    void setUp() {
        orchestrator = new DocumentIngestionOrchestrator(storageService, textExtractor, ingestionService);
    }

    @Test
    @DisplayName("Should ingest stored document by extracting text and delegating to ingestion service")
    void ingestStoredDocument_Success() {
        String storagePath = "knowledge/doc-1/tnau_guide.pdf";
        KnowledgeIngestionRequest request = KnowledgeIngestionRequest.builder()
                .title("TNAU Paddy Guide")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.TAMIL)
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .crop("Paddy")
                .originalFilename("tnau_guide.pdf")
                .contentType("application/pdf")
                .storagePath(storagePath)
                .status(DocumentStatus.ACTIVE)
                .build();

        byte[] fakeContent = "Extracted text from PDF".getBytes(StandardCharsets.UTF_8);
        when(storageService.getDocumentStream(storagePath)).thenReturn(new ByteArrayInputStream(fakeContent));
        when(textExtractor.extractText(any(InputStream.class), eq("tnau_guide.pdf"), eq("application/pdf")))
                .thenReturn("Extracted text from PDF");

        KnowledgeIngestionResult expectedResult = KnowledgeIngestionResult.builder()
                .documentId(UUID.randomUUID())
                .title("TNAU Paddy Guide")
                .status(DocumentStatus.ACTIVE)
                .chunkCount(2)
                .vectorCount(2)
                .outcome("SUCCESS")
                .build();
        when(ingestionService.ingestDocument(request)).thenReturn(expectedResult);

        KnowledgeIngestionResult result = orchestrator.ingestStoredDocument(request);

        assertThat(result).isNotNull();
        assertThat(result.getOutcome()).isEqualTo("SUCCESS");
        assertThat(request.getContent()).isEqualTo("Extracted text from PDF");
        assertThat(request.getStoragePath()).isEqualTo(storagePath);

        verify(storageService).getDocumentStream(storagePath);
        verify(textExtractor).extractText(any(InputStream.class), eq("tnau_guide.pdf"), eq("application/pdf"));
        verify(ingestionService).ingestDocument(request);
    }

    @Test
    @DisplayName("Should store in MinIO and ingest in single flow")
    void storeAndIngest_Success() {
        UUID docId = UUID.randomUUID();
        String originalFilename = "icar_bulletin.txt";
        String contentType = "text/plain";
        byte[] docBytes = "ICAR Agricultural Advisory".getBytes(StandardCharsets.UTF_8);
        String storagePath = "knowledge/" + docId + "/icar_bulletin.txt";

        when(storageService.storeDocument(docId, originalFilename, contentType, docBytes))
                .thenReturn(storagePath);
        when(storageService.getDocumentStream(storagePath))
                .thenReturn(new ByteArrayInputStream(docBytes));
        when(textExtractor.extractText(any(InputStream.class), eq(originalFilename), eq(contentType)))
                .thenReturn("ICAR Agricultural Advisory");

        KnowledgeIngestionRequest metadata = KnowledgeIngestionRequest.builder()
                .title("ICAR Bulletin")
                .sourceType(SourceType.GOVERNMENT)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.GENERAL_FARMING)
                .build();

        when(ingestionService.ingestDocument(any(KnowledgeIngestionRequest.class)))
                .thenReturn(KnowledgeIngestionResult.builder().outcome("SUCCESS").build());

        KnowledgeIngestionResult result = orchestrator.storeAndIngest(
                docId, originalFilename, contentType, docBytes, metadata);

        assertThat(result.getOutcome()).isEqualTo("SUCCESS");
        assertThat(metadata.getStoragePath()).isEqualTo(storagePath);
        assertThat(metadata.getOriginalFilename()).isEqualTo(originalFilename);
        assertThat(metadata.getContentType()).isEqualTo(contentType);
        assertThat(metadata.getFileSizeBytes()).isEqualTo((long) docBytes.length);

        verify(storageService).storeDocument(docId, originalFilename, contentType, docBytes);
    }

    @Test
    @DisplayName("Should reject request with missing storagePath")
    void ingestStoredDocument_RejectsMissingStoragePath() {
        KnowledgeIngestionRequest request = KnowledgeIngestionRequest.builder()
                .title("TNAU Guide")
                .build();

        assertThatThrownBy(() -> orchestrator.ingestStoredDocument(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("storagePath is required");
    }
}
