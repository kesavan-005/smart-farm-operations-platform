package com.smartfarm.features.knowledge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeChunk;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.repository.KnowledgeChunkRepository;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("dev")
@DisplayName("Phase 3A - Knowledge Data Model Persistence Tests")
class KnowledgeModelPersistenceTest {

    @Autowired
    private KnowledgeDocumentRepository documentRepository;

    @Autowired
    private KnowledgeChunkRepository chunkRepository;

    @Test
    @DisplayName("1. KnowledgeDocument persistence - create, save, retrieve with all metadata")
    void testKnowledgeDocumentPersistence() {
        KnowledgeDocument document = KnowledgeDocument.builder()
                .title("TNAU Paddy Cultivation Guide 2024")
                .source("Tamil Nadu Agricultural University")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.TAMIL)
                .crop("Paddy")
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .authority("TNAU Extension Directorate")
                .version("2024.1")
                .publishedDate(LocalDate.of(2024, 1, 15))
                .lastVerifiedAt(OffsetDateTime.now())
                .sourceUrl("https://tnau.ac.in/extension/paddy-guide-2024.pdf")
                .status(DocumentStatus.ACTIVE)
                .metadata("{\"region\": \"Tamil Nadu\", \"target_season\": \"Kharif\"}")
                .build();

        KnowledgeDocument saved = documentRepository.saveAndFlush(document);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();

        Optional<KnowledgeDocument> found = documentRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getTitle()).isEqualTo("TNAU Paddy Cultivation Guide 2024");
        assertThat(found.get().getSourceType()).isEqualTo(SourceType.AGRICULTURAL_UNIVERSITY);
        assertThat(found.get().getLanguage()).isEqualTo(KnowledgeLanguage.TAMIL);
        assertThat(found.get().getCrop()).isEqualTo("Paddy");
        assertThat(found.get().getTopic()).isEqualTo(KnowledgeTopic.CROP_MANAGEMENT);
        assertThat(found.get().getStatus()).isEqualTo(DocumentStatus.ACTIVE);
    }

    @Test
    @DisplayName("2. KnowledgeChunk persistence and relationship with parent document")
    void testKnowledgeChunkPersistenceAndRelationship() {
        KnowledgeDocument doc = KnowledgeDocument.builder()
                .title("Tomato Pest Management Handbook")
                .sourceType(SourceType.GOVERNMENT)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.PEST_MANAGEMENT)
                .crop("Tomato")
                .status(DocumentStatus.ACTIVE)
                .build();

        KnowledgeDocument savedDoc = documentRepository.saveAndFlush(doc);

        KnowledgeChunk chunk0 = KnowledgeChunk.builder()
                .document(savedDoc)
                .chunkIndex(0)
                .content("Tomato fruit borer (Helicoverpa armigera) management guidelines.")
                .language(KnowledgeLanguage.ENGLISH)
                .metadata("{\"section\": \"Pest Identification\", \"page\": 12}")
                .build();

        KnowledgeChunk savedChunk = chunkRepository.saveAndFlush(chunk0);
        assertThat(savedChunk.getId()).isNotNull();
        assertThat(savedChunk.getDocument().getId()).isEqualTo(savedDoc.getId());
        assertThat(savedChunk.getChunkIndex()).isEqualTo(0);
    }

    @Test
    @DisplayName("3. Document -> Chunk relationship cascade and orphan removal")
    void testDocumentChunkCascadeAndOrphanRemoval() {
        KnowledgeDocument doc = KnowledgeDocument.builder()
                .title("Drip Irrigation Best Practices")
                .sourceType(SourceType.OFFICIAL_GUIDANCE)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.IRRIGATION)
                .status(DocumentStatus.ACTIVE)
                .build();

        KnowledgeChunk chunk0 = KnowledgeChunk.builder()
                .chunkIndex(0)
                .content("Install lateral lines along crop rows.")
                .build();

        KnowledgeChunk chunk1 = KnowledgeChunk.builder()
                .chunkIndex(1)
                .content("Maintain operating pressure between 1.0 to 1.5 bar.")
                .build();

        doc.addChunk(chunk0);
        doc.addChunk(chunk1);

        KnowledgeDocument savedDoc = documentRepository.save(doc);
        documentRepository.flush();

        assertThat(savedDoc.getChunks()).hasSize(2);

        UUID docId = savedDoc.getId();
        UUID chunk0Id = chunk0.getId();
        UUID chunk1Id = chunk1.getId();

        assertThat(chunkRepository.findById(chunk0Id)).isPresent();
        assertThat(chunkRepository.findById(chunk1Id)).isPresent();

        // Cascade delete on document deletion
        documentRepository.delete(savedDoc);
        documentRepository.flush();

        assertThat(documentRepository.findById(docId)).isEmpty();
        assertThat(chunkRepository.findById(chunk0Id)).isEmpty();
        assertThat(chunkRepository.findById(chunk1Id)).isEmpty();
    }

    @Test
    @DisplayName("4. Deterministic chunk index ordering")
    void testChunkIndexOrdering() {
        KnowledgeDocument doc = KnowledgeDocument.builder()
                .title("Soil Health Assessment")
                .sourceType(SourceType.RESEARCH_INSTITUTION)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.SOIL)
                .status(DocumentStatus.ACTIVE)
                .build();

        KnowledgeDocument savedDoc = documentRepository.save(doc);

        // Insert chunks out of order
        KnowledgeChunk chunk2 = KnowledgeChunk.builder().document(savedDoc).chunkIndex(2).content("Chunk index 2").build();
        KnowledgeChunk chunk0 = KnowledgeChunk.builder().document(savedDoc).chunkIndex(0).content("Chunk index 0").build();
        KnowledgeChunk chunk1 = KnowledgeChunk.builder().document(savedDoc).chunkIndex(1).content("Chunk index 1").build();

        chunkRepository.saveAll(List.of(chunk2, chunk0, chunk1));
        chunkRepository.flush();

        List<KnowledgeChunk> orderedChunks = chunkRepository.findByDocument_IdOrderByChunkIndexAsc(savedDoc.getId());
        assertThat(orderedChunks).hasSize(3);
        assertThat(orderedChunks.get(0).getChunkIndex()).isEqualTo(0);
        assertThat(orderedChunks.get(1).getChunkIndex()).isEqualTo(1);
        assertThat(orderedChunks.get(2).getChunkIndex()).isEqualTo(2);
    }

    @Test
    @DisplayName("5. Unique constraint on (document_id, chunk_index)")
    void testUniqueConstraintOnDocumentIdAndChunkIndex() {
        KnowledgeDocument doc = KnowledgeDocument.builder()
                .title("Fertilizer Calculation Guide")
                .sourceType(SourceType.EXTENSION_SERVICE)
                .language(KnowledgeLanguage.ENGLISH)
                .topic(KnowledgeTopic.FERTILIZATION)
                .status(DocumentStatus.ACTIVE)
                .build();

        KnowledgeDocument savedDoc = documentRepository.save(doc);

        KnowledgeChunk chunkA = KnowledgeChunk.builder().document(savedDoc).chunkIndex(0).content("First content").build();
        chunkRepository.saveAndFlush(chunkA);

        KnowledgeChunk chunkB = KnowledgeChunk.builder().document(savedDoc).chunkIndex(0).content("Duplicate index content").build();

        assertThatThrownBy(() -> {
            chunkRepository.saveAndFlush(chunkB);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("6. Metadata persistence and query filtering")
    void testMetadataAndQueryFiltering() {
        KnowledgeDocument doc1 = KnowledgeDocument.builder()
                .title("Cotton Weed Control")
                .sourceType(SourceType.SCIENTIFIC_PUBLICATION)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Cotton")
                .topic(KnowledgeTopic.WEED_MANAGEMENT)
                .status(DocumentStatus.ACTIVE)
                .build();

        KnowledgeDocument doc2 = KnowledgeDocument.builder()
                .title("Banana Disease Diagnostic")
                .sourceType(SourceType.SCIENTIFIC_PUBLICATION)
                .language(KnowledgeLanguage.TAMIL)
                .crop("Banana")
                .topic(KnowledgeTopic.DISEASE_MANAGEMENT)
                .status(DocumentStatus.DRAFT)
                .build();

        documentRepository.saveAll(List.of(doc1, doc2));
        documentRepository.flush();

        List<KnowledgeDocument> activeDocs = documentRepository.findByStatus(DocumentStatus.ACTIVE);
        assertThat(activeDocs).extracting(KnowledgeDocument::getTitle).contains("Cotton Weed Control");

        List<KnowledgeDocument> tamilDocs = documentRepository.findByLanguage(KnowledgeLanguage.TAMIL);
        assertThat(tamilDocs).extracting(KnowledgeDocument::getTitle).contains("Banana Disease Diagnostic");

        List<KnowledgeDocument> cottonDocs = documentRepository.findByCrop("Cotton");
        assertThat(cottonDocs).extracting(KnowledgeDocument::getTitle).contains("Cotton Weed Control");
    }
}
