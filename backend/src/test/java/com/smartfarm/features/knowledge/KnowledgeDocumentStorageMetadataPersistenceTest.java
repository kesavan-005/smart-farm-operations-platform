package com.smartfarm.features.knowledge;

import static org.assertj.core.api.Assertions.assertThat;

import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("dev")
@DisplayName("Phase 2.2 - Knowledge Document Storage Metadata Persistence Tests")
class KnowledgeDocumentStorageMetadataPersistenceTest {

    @Autowired
    private KnowledgeDocumentRepository documentRepository;

    @Test
    @DisplayName("Should persist and retrieve original document storage metadata fields")
    void persistDocumentStorageMetadata_Success() {
        UUID docId = UUID.randomUUID();
        String storagePath = "knowledge/" + docId + "/TNAU_Paddy_Protection_2026.pdf";

        KnowledgeDocument document = KnowledgeDocument.builder()
                .title("TNAU Paddy Crop Protection Guide")
                .source("Tamil Nadu Agricultural University")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.TAMIL)
                .crop("Paddy")
                .topic(KnowledgeTopic.DISEASE_MANAGEMENT)
                .authority("TNAU")
                .version("2026.1")
                .publishedDate(LocalDate.of(2026, 1, 10))
                .lastVerifiedAt(OffsetDateTime.now())
                .status(DocumentStatus.ACTIVE)
                .originalFilename("TNAU_Paddy_Protection_2026.pdf")
                .contentType("application/pdf")
                .fileSizeBytes(1048576L) // 1 MB
                .storagePath(storagePath)
                .build();

        KnowledgeDocument saved = documentRepository.saveAndFlush(document);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getOriginalFilename()).isEqualTo("TNAU_Paddy_Protection_2026.pdf");
        assertThat(saved.getContentType()).isEqualTo("application/pdf");
        assertThat(saved.getFileSizeBytes()).isEqualTo(1048576L);
        assertThat(saved.getStoragePath()).isEqualTo(storagePath);

        // Fetch back from database
        Optional<KnowledgeDocument> reloaded = documentRepository.findById(saved.getId());
        assertThat(reloaded).isPresent();
        assertThat(reloaded.get().getOriginalFilename()).isEqualTo("TNAU_Paddy_Protection_2026.pdf");
        assertThat(reloaded.get().getContentType()).isEqualTo("application/pdf");
        assertThat(reloaded.get().getFileSizeBytes()).isEqualTo(1048576L);
        assertThat(reloaded.get().getStoragePath()).isEqualTo(storagePath);
    }

    @Test
    @DisplayName("Should update storage metadata fields on existing document")
    void updateStorageMetadata_Success() {
        KnowledgeDocument document = KnowledgeDocument.builder()
                .title("ICAR Turmeric Advisory Draft")
                .sourceType(SourceType.GOVERNMENT)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Turmeric")
                .topic(KnowledgeTopic.CROP_MANAGEMENT)
                .status(DocumentStatus.DRAFT)
                .build();

        KnowledgeDocument saved = documentRepository.saveAndFlush(document);
        assertThat(saved.getStoragePath()).isNull();

        // Attach storage metadata
        String path = "knowledge/" + saved.getId() + "/icar_turmeric_v2.docx";
        saved.setOriginalFilename("icar_turmeric_v2.docx");
        saved.setContentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        saved.setFileSizeBytes(204800L);
        saved.setStoragePath(path);
        saved.setStatus(DocumentStatus.ACTIVE);

        KnowledgeDocument updated = documentRepository.saveAndFlush(saved);

        assertThat(updated.getStoragePath()).isEqualTo(path);
        assertThat(updated.getOriginalFilename()).isEqualTo("icar_turmeric_v2.docx");
        assertThat(updated.getFileSizeBytes()).isEqualTo(204800L);
        assertThat(updated.getStatus()).isEqualTo(DocumentStatus.ACTIVE);
    }
}
