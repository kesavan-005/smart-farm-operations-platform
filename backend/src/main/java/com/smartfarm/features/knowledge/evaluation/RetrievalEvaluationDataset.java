package com.smartfarm.features.knowledge.evaluation;

import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import java.util.List;

/**
 * Phase 2.8.2: Standard controlled agricultural evaluation dataset.
 * Contains realistic queries covering all 5 authoritative production documents,
 * Tamil queries, and negative control queries where no match should be returned.
 */
public final class RetrievalEvaluationDataset {

    private RetrievalEvaluationDataset() {
        // Utility class
    }

    public static final String DOC_TNAU_BLACKGRAM = "Crop Production - Pulses: Blackgram (Vigna mungo L.)";
    public static final String DOC_TNAU_CPG_2012 = "Crop Production Guide 2012";
    public static final String DOC_TNAU_LGP = "Length of Growing Period based Cropping Pattern for different Agro-ecological Zones of Tamil Nadu";
    public static final String DOC_ICAR_KHARIF_EN = "ICAR Kharif Agro-Advisories for Farmers 2025 (English Edition)";
    public static final String DOC_ICAR_KHARIF_MULTI = "ICAR Kharif Agro-Advisory 2025 for Farmers (Regional Languages Edition)";

    public static List<RetrievalEvaluationCase> getStandardEvaluationCases() {
        return List.of(
                // 1. Blackgram cultivation
                RetrievalEvaluationCase.builder()
                        .id("EVAL-01-BLACKGRAM-CULTIVATION")
                        .category("BLACKGRAM")
                        .question("What are the recommended land preparation and cultivation practices for blackgram?")
                        .expectedDocumentTitle(DOC_TNAU_BLACKGRAM)
                        .acceptableDocumentTitles(List.of(DOC_TNAU_BLACKGRAM, DOC_TNAU_CPG_2012))
                        .expectedCrop("Blackgram")
                        .expectedTopic(KnowledgeTopic.CROP_MANAGEMENT)
                        .language(KnowledgeLanguage.ENGLISH)
                        .expectNoResult(false)
                        .description("TNAU blackgram land preparation with FYM and seed bed guidelines")
                        .build(),

                // 2. Blackgram seed rate
                RetrievalEvaluationCase.builder()
                        .id("EVAL-02-BLACKGRAM-SEED-RATE")
                        .category("BLACKGRAM")
                        .question("What is the seed rate required per hectare for pure crop blackgram?")
                        .expectedDocumentTitle(DOC_TNAU_BLACKGRAM)
                        .acceptableDocumentTitles(List.of(DOC_TNAU_BLACKGRAM, DOC_TNAU_CPG_2012))
                        .expectedCrop("Blackgram")
                        .expectedTopic(KnowledgeTopic.CROP_MANAGEMENT)
                        .language(KnowledgeLanguage.ENGLISH)
                        .expectNoResult(false)
                        .description("TNAU blackgram seed rate: 20 kg/ha for pure crop, 25 kg/ha for rice fallows")
                        .build(),

                // 3. Blackgram spacing
                RetrievalEvaluationCase.builder()
                        .id("EVAL-03-BLACKGRAM-SPACING")
                        .category("BLACKGRAM")
                        .question("What spacing should be adopted for irrigated blackgram dibbling?")
                        .expectedDocumentTitle(DOC_TNAU_BLACKGRAM)
                        .acceptableDocumentTitles(List.of(DOC_TNAU_BLACKGRAM, DOC_TNAU_CPG_2012))
                        .expectedCrop("Blackgram")
                        .expectedTopic(KnowledgeTopic.CROP_MANAGEMENT)
                        .language(KnowledgeLanguage.ENGLISH)
                        .expectNoResult(false)
                        .description("TNAU blackgram spacing: 30 x 10 cm for irrigated, 25 x 10 cm for rainfed")
                        .build(),

                // 4. Blackgram fertilizer recommendations
                RetrievalEvaluationCase.builder()
                        .id("EVAL-04-BLACKGRAM-FERTILIZER")
                        .category("BLACKGRAM")
                        .question("What is the recommended fertilizer application and micronutrient seed treatment for blackgram?")
                        .expectedDocumentTitle(DOC_TNAU_BLACKGRAM)
                        .acceptableDocumentTitles(List.of(DOC_TNAU_BLACKGRAM, DOC_TNAU_CPG_2012))
                        .expectedCrop("Blackgram")
                        .expectedTopic(KnowledgeTopic.CROP_MANAGEMENT)
                        .language(KnowledgeLanguage.ENGLISH)
                        .expectNoResult(false)
                        .description("TNAU blackgram micronutrient seed coating with Zn, Mo, Co and nitrogen substitution")
                        .build(),

                // 5. Crop planning / LGP
                RetrievalEvaluationCase.builder()
                        .id("EVAL-05-LGP-CROP-PLANNING")
                        .category("CROP_PLANNING")
                        .question("How is Length of Growing Period LGP used for cropping patterns in agro-ecological zones of Tamil Nadu?")
                        .expectedDocumentTitle(DOC_TNAU_LGP)
                        .expectedTopic(KnowledgeTopic.CROP_MANAGEMENT)
                        .language(KnowledgeLanguage.ENGLISH)
                        .expectNoResult(false)
                        .description("TNAU Length of Growing Period based cropping pattern and zone analysis")
                        .build(),

                // 6. ICAR Kharif advisories
                RetrievalEvaluationCase.builder()
                        .id("EVAL-06-ICAR-KHARIF-ADVISORY")
                        .category("WEATHER_RESPONSE")
                        .question("What are the ICAR kharif agro-advisories for contingency crop planning during drought and rainfall variation?")
                        .expectedDocumentTitle(DOC_ICAR_KHARIF_EN)
                        .expectedTopic(KnowledgeTopic.WEATHER_RESPONSE)
                        .language(KnowledgeLanguage.ENGLISH)
                        .expectNoResult(false)
                        .description("ICAR Kharif 2025 advisory guidelines for drought and seasonal management")
                        .build(),

                // 7. Rice pest / advisory content
                RetrievalEvaluationCase.builder()
                        .id("EVAL-07-RICE-PEST-MANAGEMENT")
                        .category("PEST_MANAGEMENT")
                        .question("What are the recommended chemical controls for stem borer and leaf folder in rice?")
                        .expectedDocumentTitle(DOC_TNAU_CPG_2012)
                        .expectedCrop("Rice")
                        .expectedTopic(KnowledgeTopic.CROP_MANAGEMENT)
                        .language(KnowledgeLanguage.ENGLISH)
                        .expectNoResult(false)
                        .description("TNAU Crop Production Guide 2012 comprehensive rice pest management")
                        .build(),

                // 8. Tamil agricultural questions
                RetrievalEvaluationCase.builder()
                        .id("EVAL-08-TAMIL-CROP-MANAGEMENT")
                        .category("TAMIL")
                        .question("காரீப் பருவ பயிர் மேலாண்மை மற்றும் பயோ-பல்ஸ் நோய் நிவாரணம் முறை என்ன?")
                        .expectedDocumentTitle(DOC_ICAR_KHARIF_MULTI)
                        .expectedTopic(KnowledgeTopic.WEATHER_RESPONSE)
                        .language(KnowledgeLanguage.MULTILINGUAL)
                        .expectNoResult(false)
                        .description("ICAR Regional Languages Edition Tamil Kharif advisories")
                        .build(),

                // 9. General agricultural questions
                RetrievalEvaluationCase.builder()
                        .id("EVAL-09-ORGANIC-NITROGEN-SUBSTITUTION")
                        .category("FERTILIZATION")
                        .question("What are the nitrogen substitution recommendations through organic sources such as vermicompost for pulses?")
                        .expectedDocumentTitle(DOC_TNAU_BLACKGRAM)
                        .acceptableDocumentTitles(List.of(DOC_TNAU_BLACKGRAM, DOC_TNAU_CPG_2012))
                        .expectedCrop("Blackgram")
                        .expectedTopic(KnowledgeTopic.CROP_MANAGEMENT)
                        .language(KnowledgeLanguage.ENGLISH)
                        .expectNoResult(false)
                        .description("TNAU vermicompost substitution of 50% nitrogen for pulses")
                        .build(),

                // 10. Negative control (Out of domain query 1)
                RetrievalEvaluationCase.builder()
                        .id("EVAL-10-NEGATIVE-QUANTUM-PHYSICS")
                        .category("NEGATIVE")
                        .question("What is the quantum superposition principle in semiconductor fabrication?")
                        .expectedDocumentTitle(null)
                        .expectNoResult(true)
                        .description("Out-of-domain quantum physics query that must return zero results")
                        .build(),

                // 11. Negative control (Out of domain query 2)
                RetrievalEvaluationCase.builder()
                        .id("EVAL-11-NEGATIVE-KUBERNETES")
                        .category("NEGATIVE")
                        .question("How to configure Kubernetes ingress controller with Nginx SSL termination?")
                        .expectedDocumentTitle(null)
                        .expectNoResult(true)
                        .description("Out-of-domain cloud infrastructure query that must return zero results")
                        .build()
        );
    }
}
