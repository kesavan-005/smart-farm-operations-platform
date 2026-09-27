package com.smartfarm.features.knowledge.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.smartfarm.common.exception.BadRequestException;
import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.knowledge.config.KnowledgeIngestionProperties;
import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentDetailDto;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentFilter;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentSummaryDto;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentUploadRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentUploadResponse;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionRequest;
import com.smartfarm.features.knowledge.exception.KnowledgeLifecycleException;
import com.smartfarm.features.knowledge.repository.KnowledgeChunkRepository;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import com.smartfarm.features.knowledge.extractor.DocumentTextExtractor;
import com.smartfarm.features.knowledge.storage.DocumentStorageService;
import java.io.InputStream;
import org.springframework.mock.web.MockMultipartFile;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("Phase 2.6 - Knowledge Management Service Unit Tests")
class KnowledgeManagementServiceTest {

    @Mock
    private KnowledgeDocumentRepository documentRepository;

    @Mock
    private KnowledgeChunkRepository chunkRepository;

    @Mock
    private JdbcOperations jdbcTemplate;

    @Mock
    private KnowledgeIngestionService ingestionService;

    @Mock
    private DocumentTextExtractor textExtractor;

    private TextNormalizer textNormalizer = new TextNormalizer();
    private DeterministicChunker chunker = new DeterministicChunker();
    private KnowledgeIngestionProperties properties = new KnowledgeIngestionProperties();

    private ObjectProvider<PgVectorStore> vectorStoreProvider;
    private boolean storageDocumentExists = true;
    private boolean deleteDocumentCalled = false;
    private DocumentStorageService storageService;

    private KnowledgeManagementService service;

    private UUID docId;
    private KnowledgeDocument sampleDoc;

    @BeforeEach
    void setUp() {
        storageDocumentExists = true;
        deleteDocumentCalled = false;
        storageService = new DocumentStorageService(null, null) {
            @Override
            public boolean documentExists(String storagePath) {
                return storageDocumentExists;
            }
            @Override
            public void deleteDocument(String storagePath) {
                deleteDocumentCalled = true;
            }
            @Override
            public String storeDocument(UUID id, String filename, String contentType, byte[] data) {
                return "knowledge/" + id + "/" + filename;
            }
        };

        vectorStoreProvider = new ObjectProvider<>() {
            @Override
            public PgVectorStore getObject(Object... args) {
                return null;
            }

            @Override
            public PgVectorStore getIfAvailable() {
                return null;
            }

            @Override
            public PgVectorStore getIfUnique() {
                return null;
            }

            @Override
            public PgVectorStore getObject() {
                return null;
            }
        };

        service = new KnowledgeManagementService(
                documentRepository,
                chunkRepository,
                storageService,
                jdbcTemplate,
                vectorStoreProvider,
                ingestionService,
                textExtractor,
                textNormalizer,
                chunker,
                properties
        );

        docId = UUID.randomUUID();
        sampleDoc = KnowledgeDocument.builder()
                .id(docId)
                .title("TNAU Blackgram Production Guide")
                .source("TNAU")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .authority("TNAU Agronomy Department")
                .language(KnowledgeLanguage.ENGLISH)
                .crop("blackgram")
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .version("1.0")
                .publishedDate(LocalDate.of(2024, 1, 1))
                .lastVerifiedAt(OffsetDateTime.now())
                .status(DocumentStatus.ACTIVE)
                .originalFilename("tnau_blackgram.pdf")
                .contentType("application/pdf")
                .fileSizeBytes(1024L * 50)
                .storagePath("knowledge/" + docId + "/tnau_blackgram.pdf")
                .build();

        ReflectionTestUtils.setField(service, "vectorTableName", "vector_store");
    }

    @Test
    @DisplayName("listDocuments: returns paged summaries with chunk counts")
    void testListDocuments() {
        Page<KnowledgeDocument> page = new PageImpl<>(List.of(sampleDoc));
        when(documentRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(chunkRepository.countByDocument_Id(docId)).thenReturn(25L);

        Page<KnowledgeDocumentSummaryDto> result = service.listDocuments(new KnowledgeDocumentFilter(), PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(1);
        KnowledgeDocumentSummaryDto summary = result.getContent().get(0);
        assertThat(summary.getId()).isEqualTo(docId);
        assertThat(summary.getTitle()).isEqualTo("TNAU Blackgram Production Guide");
        assertThat(summary.getSource()).isEqualTo("TNAU");
        assertThat(summary.getChunkCount()).isEqualTo(25);
    }

    @Test
    @DisplayName("getDocumentDetails: returns full metadata, storage presence, and vector counts")
    void testGetDocumentDetails() {
        when(documentRepository.findById(docId)).thenReturn(Optional.of(sampleDoc));
        when(chunkRepository.countByDocument_Id(docId)).thenReturn(25L);
        storageDocumentExists = true;

        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM information_schema.tables WHERE table_name = ?"),
                eq(Integer.class),
                eq("vector_store"))).thenReturn(1);

        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM vector_store WHERE id IN (SELECT id FROM knowledge_chunks WHERE document_id = ?)"),
                eq(Integer.class),
                eq(docId))).thenReturn(25);

        KnowledgeDocumentDetailDto detail = service.getDocumentDetails(docId);

        assertThat(detail.getId()).isEqualTo(docId);
        assertThat(detail.getTitle()).isEqualTo("TNAU Blackgram Production Guide");
        assertThat(detail.getAuthority()).isEqualTo("TNAU Agronomy Department");
        assertThat(detail.getChunkCount()).isEqualTo(25);
        assertThat(detail.getVectorCount()).isEqualTo(25);
        assertThat(detail.isFileInStorage()).isTrue();
    }

    @Test
    @DisplayName("getDocumentDetails: throws ResourceNotFoundException for unknown ID")
    void testGetDocumentDetails_NotFound() {
        UUID unknownId = UUID.randomUUID();
        when(documentRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getDocumentDetails(unknownId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("not found");
    }

    @Test
    @DisplayName("activateDocument: successfully transitions DRAFT to ACTIVE when all safety checks pass")
    void testActivateDocument_Success() {
        sampleDoc.setStatus(DocumentStatus.DRAFT);
        when(documentRepository.findById(docId)).thenReturn(Optional.of(sampleDoc));
        when(chunkRepository.countByDocument_Id(docId)).thenReturn(25L);
        storageDocumentExists = true;

        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM information_schema.tables WHERE table_name = ?"),
                eq(Integer.class),
                eq("vector_store"))).thenReturn(1);

        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM vector_store WHERE id IN (SELECT id FROM knowledge_chunks WHERE document_id = ?)"),
                eq(Integer.class),
                eq(docId))).thenReturn(25);

        when(documentRepository.save(any(KnowledgeDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        KnowledgeDocumentDetailDto result = service.activateDocument(docId);

        assertThat(result.getStatus()).isEqualTo(DocumentStatus.ACTIVE);
        verify(documentRepository).save(sampleDoc);

        // Vector metadata status updated to ACTIVE
        verify(jdbcTemplate).update(
                eq("UPDATE vector_store SET metadata = jsonb_set(metadata::jsonb, '{status}', to_jsonb(?::text))::json WHERE id IN (SELECT id FROM knowledge_chunks WHERE document_id = ?)"),
                eq("ACTIVE"),
                eq(docId)
        );
    }

    @Test
    @DisplayName("activateDocument: throws KnowledgeLifecycleException if document is already ACTIVE")
    void testActivateDocument_AlreadyActive() {
        sampleDoc.setStatus(DocumentStatus.ACTIVE);
        when(documentRepository.findById(docId)).thenReturn(Optional.of(sampleDoc));

        assertThatThrownBy(() -> service.activateDocument(docId))
                .isInstanceOf(KnowledgeLifecycleException.class)
                .hasMessageContaining("already ACTIVE");
    }

    @Test
    @DisplayName("activateDocument: throws KnowledgeLifecycleException if metadata is invalid (missing title)")
    void testActivateDocument_MissingTitle() {
        sampleDoc.setStatus(DocumentStatus.DRAFT);
        sampleDoc.setTitle("   ");
        when(documentRepository.findById(docId)).thenReturn(Optional.of(sampleDoc));

        assertThatThrownBy(() -> service.activateDocument(docId))
                .isInstanceOf(KnowledgeLifecycleException.class)
                .hasMessageContaining("title");
    }

    @Test
    @DisplayName("activateDocument: throws KnowledgeLifecycleException if storage file is missing")
    void testActivateDocument_MissingStorageFile() {
        sampleDoc.setStatus(DocumentStatus.DRAFT);
        when(documentRepository.findById(docId)).thenReturn(Optional.of(sampleDoc));
        storageDocumentExists = false; // file missing

        assertThatThrownBy(() -> service.activateDocument(docId))
                .isInstanceOf(KnowledgeLifecycleException.class)
                .hasMessageContaining("does not exist in object storage");
    }

    @Test
    @DisplayName("activateDocument: throws KnowledgeLifecycleException if document has 0 chunks")
    void testActivateDocument_ZeroChunks() {
        sampleDoc.setStatus(DocumentStatus.DRAFT);
        when(documentRepository.findById(docId)).thenReturn(Optional.of(sampleDoc));
        storageDocumentExists = true;
        when(chunkRepository.countByDocument_Id(docId)).thenReturn(0L);

        assertThatThrownBy(() -> service.activateDocument(docId))
                .isInstanceOf(KnowledgeLifecycleException.class)
                .hasMessageContaining("no extracted knowledge chunks");
    }

    @Test
    @DisplayName("activateDocument: throws KnowledgeLifecycleException if chunk/vector counts mismatch")
    void testActivateDocument_MissingVectors() {
        sampleDoc.setStatus(DocumentStatus.DRAFT);
        when(documentRepository.findById(docId)).thenReturn(Optional.of(sampleDoc));
        storageDocumentExists = true;
        when(chunkRepository.countByDocument_Id(docId)).thenReturn(25L);

        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM information_schema.tables WHERE table_name = ?"),
                eq(Integer.class),
                eq("vector_store"))).thenReturn(1);

        // Only 10 vectors found for 25 chunks!
        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM vector_store WHERE id IN (SELECT id FROM knowledge_chunks WHERE document_id = ?)"),
                eq(Integer.class),
                eq(docId))).thenReturn(10);

        assertThatThrownBy(() -> service.activateDocument(docId))
                .isInstanceOf(KnowledgeLifecycleException.class)
                .hasMessageContaining("missing corresponding vector embeddings");
    }

    @Test
    @DisplayName("archiveDocument: successfully transitions ACTIVE to ARCHIVED and marks vectors ARCHIVED")
    void testArchiveDocument_Success() {
        sampleDoc.setStatus(DocumentStatus.ACTIVE);
        when(documentRepository.findById(docId)).thenReturn(Optional.of(sampleDoc));
        when(documentRepository.save(any(KnowledgeDocument.class))).thenAnswer(invocation -> invocation.getArgument(0));

        when(jdbcTemplate.queryForObject(
                eq("SELECT count(*) FROM information_schema.tables WHERE table_name = ?"),
                eq(Integer.class),
                eq("vector_store"))).thenReturn(1);

        KnowledgeDocumentDetailDto result = service.archiveDocument(docId);

        assertThat(result.getStatus()).isEqualTo(DocumentStatus.ARCHIVED);
        verify(documentRepository).save(sampleDoc);

        // Vector metadata status updated to ARCHIVED so RAG retrieval automatically excludes them
        verify(jdbcTemplate).update(
                eq("UPDATE vector_store SET metadata = jsonb_set(metadata::jsonb, '{status}', to_jsonb(?::text))::json WHERE id IN (SELECT id FROM knowledge_chunks WHERE document_id = ?)"),
                eq("ARCHIVED"),
                eq(docId)
        );

        // Verify no destructive deletion occurred (archive preservation rule)
        assertThat(deleteDocumentCalled).isFalse();
        verify(chunkRepository, never()).deleteByDocument_Id(any());
        verify(documentRepository, never()).delete(any(KnowledgeDocument.class));
    }

    @Test
    @DisplayName("archiveDocument: throws KnowledgeLifecycleException when archiving DRAFT (invalid transition)")
    void testArchiveDocument_DraftInvalidTransition() {
        sampleDoc.setStatus(DocumentStatus.DRAFT);
        when(documentRepository.findById(docId)).thenReturn(Optional.of(sampleDoc));

        assertThatThrownBy(() -> service.archiveDocument(docId))
                .isInstanceOf(KnowledgeLifecycleException.class)
                .hasMessageContaining("Only ACTIVE documents can be archived");
    }

    @Test
    @DisplayName("findDuplicateIdentity: returns matching document if title + version + source already exists")
    void testFindDuplicateIdentity_Match() {
        when(documentRepository.findAll(any(Specification.class))).thenReturn(List.of(sampleDoc));

        Optional<KnowledgeDocument> duplicate = service.findDuplicateIdentity(
                "TNAU Blackgram Production Guide",
                "1.0",
                "TNAU"
        );

        assertThat(duplicate).isPresent();
        assertThat(duplicate.get().getId()).isEqualTo(docId);
    }

    @Test
    @DisplayName("findDuplicateIdentity: allows different version to be preserved (version safety)")
    void testFindDuplicateIdentity_DifferentVersionPreserved() {
        when(documentRepository.findAll(any(Specification.class))).thenReturn(List.of());

        Optional<KnowledgeDocument> duplicate = service.findDuplicateIdentity(
                "TNAU Blackgram Production Guide",
                "2.0", // Different version
                "TNAU"
        );

        assertThat(duplicate).isEmpty();
    }

    @Test
    @DisplayName("uploadDocument: successful upload of valid document persists doc, chunks, and returns response")
    void testUploadDocument_Success() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "pulse_guide.pdf",
                "application/pdf",
                "%PDF-1.4 Pulse crop guidelines for blackgram cultivation".getBytes()
        );

        KnowledgeDocumentUploadRequest request = KnowledgeDocumentUploadRequest.builder()
                .file(file)
                .title("New Blackgram Guide")
                .source("TNAU")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .crop("blackgram")
                .version("2026")
                .status(DocumentStatus.DRAFT)
                .build();

        when(documentRepository.findAll(any(Specification.class))).thenReturn(List.of());
        when(textExtractor.isSupported("pulse_guide.pdf", "application/pdf")).thenReturn(true);
        when(textExtractor.extractText(any(byte[].class), eq("pulse_guide.pdf"), eq("application/pdf")))
                .thenReturn("Detailed seed treatment and nutrient management for blackgram pulse crops.");
        when(documentRepository.save(any(KnowledgeDocument.class))).thenAnswer(i -> i.getArgument(0));
        when(chunkRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        KnowledgeDocumentUploadResponse response = service.uploadDocument(request);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("New Blackgram Guide");
        assertThat(response.getStatus()).isEqualTo(DocumentStatus.DRAFT);
        assertThat(response.getIngestionStatus()).isEqualTo("INGESTED");
        assertThat(response.getChunkCount()).isGreaterThan(0);
        assertThat(response.getStoragePath()).contains("pulse_guide.pdf");
        assertThat(deleteDocumentCalled).isFalse();
    }

    @Test
    @DisplayName("uploadDocument: empty file rejected with BadRequestException")
    void testUploadDocument_EmptyFile_Rejected() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.pdf",
                "application/pdf",
                new byte[0]
        );

        KnowledgeDocumentUploadRequest request = KnowledgeDocumentUploadRequest.builder()
                .file(emptyFile)
                .title("Empty Document")
                .sourceType(SourceType.GOVERNMENT)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .build();

        assertThatThrownBy(() -> service.uploadDocument(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("empty");
    }

    @Test
    @DisplayName("uploadDocument: unsupported format rejected with BadRequestException")
    void testUploadDocument_UnsupportedFormat_Rejected() {
        MockMultipartFile exeFile = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/x-msdownload",
                "binary content".getBytes()
        );

        KnowledgeDocumentUploadRequest request = KnowledgeDocumentUploadRequest.builder()
                .file(exeFile)
                .title("Malicious Exe")
                .sourceType(SourceType.GOVERNMENT)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .build();

        when(textExtractor.isSupported("malicious.exe", "application/x-msdownload")).thenReturn(false);

        assertThatThrownBy(() -> service.uploadDocument(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Unsupported document format");
    }

    @Test
    @DisplayName("uploadDocument: duplicate document rejected before MinIO storage or extraction")
    void testUploadDocument_Duplicate_Rejected() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "duplicate.pdf",
                "application/pdf",
                "content".getBytes()
        );

        KnowledgeDocumentUploadRequest request = KnowledgeDocumentUploadRequest.builder()
                .file(file)
                .title("TNAU Blackgram Production Guide")
                .source("TNAU")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .version("1.0")
                .build();

        when(documentRepository.findAll(any(Specification.class))).thenReturn(List.of(sampleDoc));
        when(textExtractor.isSupported("duplicate.pdf", "application/pdf")).thenReturn(true);

        assertThatThrownBy(() -> service.uploadDocument(request))
                .isInstanceOf(KnowledgeLifecycleException.class)
                .hasMessageContaining("Duplicate document rejected");
    }

    @Test
    @DisplayName("uploadDocument: extraction failure triggers MinIO file cleanup and throws BadRequestException")
    void testUploadDocument_ExtractionFailure_CleansUpMinio() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "corrupt.pdf",
                "application/pdf",
                "corrupt content".getBytes()
        );

        KnowledgeDocumentUploadRequest request = KnowledgeDocumentUploadRequest.builder()
                .file(file)
                .title("Corrupt PDF Document")
                .source("ICAR")
                .sourceType(SourceType.RESEARCH_INSTITUTION)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .version("1.0")
                .build();

        when(documentRepository.findAll(any(Specification.class))).thenReturn(List.of());
        when(textExtractor.isSupported("corrupt.pdf", "application/pdf")).thenReturn(true);
        when(textExtractor.extractText(any(byte[].class), eq("corrupt.pdf"), eq("application/pdf")))
                .thenThrow(new RuntimeException("Corrupted PDF stream"));

        assertThatThrownBy(() -> service.uploadDocument(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Failed to extract text");

        assertThat(deleteDocumentCalled).as("MinIO file must be deleted on extraction failure").isTrue();
    }
}
