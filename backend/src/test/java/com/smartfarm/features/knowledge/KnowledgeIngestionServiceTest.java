package com.smartfarm.features.knowledge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.smartfarm.common.exception.BadRequestException;
import com.smartfarm.features.knowledge.config.KnowledgeIngestionProperties;
import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionResult;
import com.smartfarm.features.knowledge.repository.KnowledgeChunkRepository;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import com.smartfarm.features.knowledge.service.DeterministicChunker;
import com.smartfarm.features.knowledge.service.KnowledgeIngestionService;
import com.smartfarm.features.knowledge.service.TextNormalizer;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.beans.factory.ObjectProvider;

@ExtendWith(MockitoExtension.class)
@DisplayName("Phase 3B - Knowledge Ingestion Service Unit Tests")
class KnowledgeIngestionServiceTest {

    @Mock
    private KnowledgeDocumentRepository documentRepository;

    @Mock
    private KnowledgeChunkRepository chunkRepository;

    private KnowledgeIngestionService service;

    @BeforeEach
    void setUp() {
        TextNormalizer textNormalizer = new TextNormalizer();
        DeterministicChunker chunker = new DeterministicChunker();
        KnowledgeIngestionProperties props = new KnowledgeIngestionProperties();
        props.setChunkSize(1000);
        props.setChunkOverlap(150);

        ObjectProvider<PgVectorStore> vectorStoreProvider = new ObjectProvider<>() {
            @Override
            public PgVectorStore getIfAvailable() {
                return null;
            }

            @Override
            public PgVectorStore getObject() {
                return null;
            }

            @Override
            public PgVectorStore getObject(Object... args) {
                return null;
            }

            @Override
            public PgVectorStore getIfUnique() {
                return null;
            }
        };

        service = new KnowledgeIngestionService(
                documentRepository,
                chunkRepository,
                textNormalizer,
                chunker,
                props,
                vectorStoreProvider
        );
    }

    @Test
    @DisplayName("Reject request when title is missing or blank")
    void testBlankTitleValidation() {
        KnowledgeIngestionRequest req = KnowledgeIngestionRequest.builder()
                .title("   ")
                .sourceType(SourceType.GOVERNMENT)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .content("Valid content text.")
                .build();

        assertThatThrownBy(() -> service.ingestDocument(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("title is required");
    }

    @Test
    @DisplayName("Reject request when content is blank")
    void testBlankContentValidation() {
        KnowledgeIngestionRequest req = KnowledgeIngestionRequest.builder()
                .title("Valid Title")
                .sourceType(SourceType.GOVERNMENT)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .content("   ")
                .build();

        assertThatThrownBy(() -> service.ingestDocument(req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("content is required");
    }

    @Test
    @DisplayName("DRAFT document ingests chunks to relational DB but skips vector store")
    void testDraftIngestionSkipsVectorStore() {
        KnowledgeIngestionRequest req = KnowledgeIngestionRequest.builder()
                .title("Draft Tomato Pest Guide")
                .sourceType(SourceType.EXTENSION_SERVICE)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.PEST_MANAGEMENT)
                .status(DocumentStatus.DRAFT)
                .content("Draft pest guide paragraph content for tomato farming.")
                .build();

        UUID docId = UUID.randomUUID();
        KnowledgeDocument savedDoc = KnowledgeDocument.builder()
                .id(docId)
                .title(req.getTitle())
                .sourceType(req.getSourceType())
                .language(req.getLanguage())
                .topic(req.getTopic())
                .status(DocumentStatus.DRAFT)
                .build();

        when(documentRepository.save(any(KnowledgeDocument.class))).thenReturn(savedDoc);
        when(chunkRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        KnowledgeIngestionResult result = service.ingestDocument(req);

        assertThat(result.getOutcome()).isEqualTo("SUCCESS");
        assertThat(result.getDocumentId()).isEqualTo(docId);
        assertThat(result.getChunkCount()).isGreaterThan(0);
        assertThat(result.getVectorCount()).isEqualTo(0);
    }
}
