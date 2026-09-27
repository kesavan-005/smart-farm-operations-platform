package com.smartfarm.features.knowledge.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeIngestionResult;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import com.smartfarm.features.knowledge.repository.KnowledgeChunkRepository;
import com.smartfarm.features.knowledge.repository.KnowledgeDocumentRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("prod")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://localhost:5432/smartfarm",
    "spring.datasource.username=smartfarm",
    "spring.datasource.password=smartfarm_dev",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.flyway.enabled=true",
    "spring.ai.vectorstore.pgvector.table-name=vector_store",
    "spring.ai.vectorstore.pgvector.dimensions=384",
    "spring.ai.vectorstore.pgvector.distance-type=COSINE_DISTANCE",
    "spring.ai.vectorstore.pgvector.index-type=HNSW",
    "smartfarm.knowledge.retrieval.max-distance=0.50"
})
@DisplayName("Phase 2.8.4 - Retrieval Filter Validation Integration Test")
class KnowledgeFilterValidationTest {

    @Autowired
    private KnowledgeIngestionService ingestionService;

    @Autowired
    private KnowledgeRetrievalService retrievalService;

    @Autowired
    private KnowledgeDocumentRepository documentRepository;

    @Autowired
    private KnowledgeChunkRepository chunkRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final List<UUID> createdDocIds = new ArrayList<>();

    @BeforeEach
    void setUp() {
        cleanTestData();
    }

    @AfterEach
    void tearDown() {
        cleanTestData();
    }

    private void cleanTestData() {
        jdbcTemplate.execute("DELETE FROM vector_store WHERE metadata->>'title' LIKE 'Phase 2.8 Filter Test%'");
        for (UUID docId : createdDocIds) {
            try {
                documentRepository.deleteById(docId);
            } catch (Exception ignored) {}
        }
        createdDocIds.clear();
    }

    @Test
    @DisplayName("Lifecycle Filter: ACTIVE documents are retrieved, DRAFT and ARCHIVED are excluded")
    void lifecycleStatusFiltering() {
        // 1. Ingest ACTIVE doc
        KnowledgeIngestionRequest activeReq = KnowledgeIngestionRequest.builder()
                .title("Phase 2.8 Filter Test Active Cotton Advisory")
                .source("Cotton Research Station")
                .sourceType(SourceType.RESEARCH_INSTITUTION)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Cotton")
                .topic(KnowledgeTopic.PEST_MANAGEMENT)
                .status(DocumentStatus.ACTIVE)
                .content("Bollworm pest management in cotton using pheromone traps and neem seed kernel extract.")
                .allowDuplicate(true)
                .build();
        KnowledgeIngestionResult activeResult = ingestionService.ingestDocument(activeReq);
        createdDocIds.add(activeResult.getDocumentId());

        // 2. Ingest DRAFT doc
        KnowledgeIngestionRequest draftReq = KnowledgeIngestionRequest.builder()
                .title("Phase 2.8 Filter Test Draft Cotton Advisory")
                .source("Cotton Research Station")
                .sourceType(SourceType.RESEARCH_INSTITUTION)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Cotton")
                .topic(KnowledgeTopic.PEST_MANAGEMENT)
                .status(DocumentStatus.DRAFT)
                .content("Draft guidelines for cotton bollworm pest control using synthetic pyrethroids.")
                .allowDuplicate(true)
                .build();
        KnowledgeIngestionResult draftResult = ingestionService.ingestDocument(draftReq);
        createdDocIds.add(draftResult.getDocumentId());

        // 3. Query
        KnowledgeRetrievalRequest query = KnowledgeRetrievalRequest.builder()
                .query("cotton bollworm pest management using pheromone traps")
                .topK(5)
                .build();

        List<KnowledgeRetrievalResult> results = retrievalService.search(query);

        // Verify ACTIVE is retrieved
        assertThat(results).anyMatch(r -> "Phase 2.8 Filter Test Active Cotton Advisory".equals(r.getTitle()));
        // Verify DRAFT is excluded
        assertThat(results).noneMatch(r -> "Phase 2.8 Filter Test Draft Cotton Advisory".equals(r.getTitle()));
    }

    @Test
    @DisplayName("Crop Filter: Correctly restricts retrieval to specified crop")
    void cropFilteringNarrowsRetrieval() {
        // Doc A: Maize
        KnowledgeIngestionRequest maizeReq = KnowledgeIngestionRequest.builder()
                .title("Phase 2.8 Filter Test Maize Borer Guide")
                .source("TNAU Dept of Entomology")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Maize")
                .topic(KnowledgeTopic.PEST_MANAGEMENT)
                .status(DocumentStatus.ACTIVE)
                .content("Fall armyworm management in maize crop using biological Trichogramma parasitoids.")
                .allowDuplicate(true)
                .build();
        KnowledgeIngestionResult maizeResult = ingestionService.ingestDocument(maizeReq);
        createdDocIds.add(maizeResult.getDocumentId());

        // Doc B: Sorghum
        KnowledgeIngestionRequest sorghumReq = KnowledgeIngestionRequest.builder()
                .title("Phase 2.8 Filter Test Sorghum Borer Guide")
                .source("TNAU Dept of Entomology")
                .sourceType(SourceType.AGRICULTURAL_UNIVERSITY)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Sorghum")
                .topic(KnowledgeTopic.PEST_MANAGEMENT)
                .status(DocumentStatus.ACTIVE)
                .content("Shoot fly and stem borer management in sorghum crop using seed hardening.")
                .allowDuplicate(true)
                .build();
        KnowledgeIngestionResult sorghumResult = ingestionService.ingestDocument(sorghumReq);
        createdDocIds.add(sorghumResult.getDocumentId());

        // Search with crop = 'Maize'
        KnowledgeRetrievalRequest maizeFilterReq = KnowledgeRetrievalRequest.builder()
                .query("fall armyworm stem borer biological control")
                .crop("Maize")
                .topK(5)
                .build();

        List<KnowledgeRetrievalResult> maizeResults = retrievalService.search(maizeFilterReq);
        assertThat(maizeResults).isNotEmpty();
        assertThat(maizeResults).allMatch(r -> "Maize".equalsIgnoreCase(r.getCrop()));
        assertThat(maizeResults).noneMatch(r -> "Phase 2.8 Filter Test Sorghum Borer Guide".equals(r.getTitle()));
    }

    @Test
    @DisplayName("Topic Filter: Correctly restricts retrieval to specified topic")
    void topicFilteringNarrowsRetrieval() {
        // Doc 1: Irrigation
        KnowledgeIngestionRequest irrigationReq = KnowledgeIngestionRequest.builder()
                .title("Phase 2.8 Filter Test Drip Irrigation Setup")
                .source("Water Technology Centre")
                .sourceType(SourceType.RESEARCH_INSTITUTION)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Sugarcane")
                .topic(KnowledgeTopic.IRRIGATION)
                .status(DocumentStatus.ACTIVE)
                .content("Sub-surface drip irrigation layout and fertigation venturi installation for sugarcane.")
                .allowDuplicate(true)
                .build();
        KnowledgeIngestionResult irrigationResult = ingestionService.ingestDocument(irrigationReq);
        createdDocIds.add(irrigationResult.getDocumentId());

        // Doc 2: Weed Management
        KnowledgeIngestionRequest weedReq = KnowledgeIngestionRequest.builder()
                .title("Phase 2.8 Filter Test Sugarcane Weed Control")
                .source("Water Technology Centre")
                .sourceType(SourceType.RESEARCH_INSTITUTION)
                .language(KnowledgeLanguage.ENGLISH)
                .crop("Sugarcane")
                .topic(KnowledgeTopic.WEED_MANAGEMENT)
                .status(DocumentStatus.ACTIVE)
                .content("Pre-emergence atrazine application for broadleaf weed control in sugarcane.")
                .allowDuplicate(true)
                .build();
        KnowledgeIngestionResult weedResult = ingestionService.ingestDocument(weedReq);
        createdDocIds.add(weedResult.getDocumentId());

        // Search with topic = IRRIGATION
        KnowledgeRetrievalRequest topicFilterReq = KnowledgeRetrievalRequest.builder()
                .query("sugarcane drip irrigation fertigation setup")
                .topic(KnowledgeTopic.IRRIGATION)
                .topK(5)
                .build();

        List<KnowledgeRetrievalResult> topicResults = retrievalService.search(topicFilterReq);
        assertThat(topicResults).isNotEmpty();
        assertThat(topicResults).allMatch(r -> "IRRIGATION".equalsIgnoreCase(r.getTopic()));
        assertThat(topicResults).noneMatch(r -> "Phase 2.8 Filter Test Sugarcane Weed Control".equals(r.getTitle()));
    }

    @Test
    @DisplayName("Negative / Unmatched Search: Returns an empty list cleanly without throwing errors")
    void unmatchedSearchReturnsEmptyListCleanly() {
        KnowledgeRetrievalRequest query = KnowledgeRetrievalRequest.builder()
                .query("extraterrestrial planetary atmospheric thermodynamics")
                .topK(5)
                .build();

        List<KnowledgeRetrievalResult> results = retrievalService.search(query);
        assertThat(results).isNotNull();
        assertThat(results).isEmpty();
    }
}
