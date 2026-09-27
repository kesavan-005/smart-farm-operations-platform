package com.smartfarm.features.advisory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.smartfarm.features.advisory.config.SmartFarmAiProperties;
import com.smartfarm.features.advisory.dto.AdvisoryContext;
import com.smartfarm.features.advisory.dto.AdvisoryRequest;
import com.smartfarm.features.advisory.dto.AdvisoryResponse;
import com.smartfarm.features.advisory.dto.AdvisorySource;
import com.smartfarm.features.advisory.exception.AdvisoryGenerationException;
import com.smartfarm.features.advisory.service.AdvisoryOrchestrationService;
import com.smartfarm.features.advisory.service.ContextAssembler;
import com.smartfarm.features.advisory.service.GroundedPromptBuilder;
import com.smartfarm.features.farm.dto.context.FarmContextResponse;
import com.smartfarm.features.farm.dto.context.FarmProfile;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import com.smartfarm.features.weather.dto.CurrentWeatherDto;
import com.smartfarm.features.weather.dto.WeatherResponse;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.security.access.AccessDeniedException;

@DisplayName("Phase 2.8.6 - 2.8.11 RAG Production Hardening, Source Integrity & Failure Resilience Tests")
class RagProductionHardeningTest {

    private ContextAssembler contextAssembler;
    private GroundedPromptBuilder promptBuilder;
    private ChatModel chatModel;
    private SmartFarmAiProperties properties;
    private AdvisoryOrchestrationService orchestrationService;

    private UUID farmId;
    private UUID userId;
    private AdvisoryRequest request;

    @BeforeEach
    void setUp() {
        contextAssembler = mock(ContextAssembler.class);
        promptBuilder = new GroundedPromptBuilder();
        chatModel = mock(ChatModel.class);
        properties = new SmartFarmAiProperties();
        properties.setEnabled(true);
        properties.setModel("gemini-3.6-flash");
        properties.setTemperature(0.7);

        orchestrationService = new AdvisoryOrchestrationService(properties, contextAssembler, promptBuilder, chatModel);

        farmId = UUID.randomUUID();
        userId = UUID.randomUUID();
        request = AdvisoryRequest.builder()
                .farmId(farmId)
                .question("How to manage leaf crinkle in blackgram?")
                .build();
    }

    @Test
    @DisplayName("Gemini 429 Rate Limit error is caught safely without leaking secrets")
    void geminiRateLimitHandledSafely() {
        when(contextAssembler.assemble(any(), any())).thenReturn(
                AdvisoryContext.builder()
                        .question(request.getQuestion())
                        .farmContext(FarmContextResponse.builder().build())
                        .retrievedKnowledge(List.of())
                        .build()
        );

        when(chatModel.call(any(Prompt.class))).thenThrow(new RuntimeException("429 RESOURCE_EXHAUSTED: Rate limit exceeded for project 123456789"));

        assertThatThrownBy(() -> orchestrationService.generateAdvisory(request, userId))
                .isInstanceOf(AdvisoryGenerationException.class)
                .hasMessageContaining("Failed to generate agricultural advisory due to an internal error.")
                .satisfies(e -> {
                    // Critical safety: Error message presented to user must not expose project IDs or internal tokens
                    assertThat(e.getMessage()).doesNotContain("123456789");
                    assertThat(e.getMessage()).doesNotContain("AIzaSy");
                });
    }

    @Test
    @DisplayName("Gemini 5xx Server Error is caught and wrapped safely")
    void gemini5xxServerErrorHandledSafely() {
        when(contextAssembler.assemble(any(), any())).thenReturn(
                AdvisoryContext.builder()
                        .question(request.getQuestion())
                        .farmContext(FarmContextResponse.builder().build())
                        .retrievedKnowledge(List.of())
                        .build()
        );

        when(chatModel.call(any(Prompt.class))).thenThrow(new RuntimeException("503 Service Unavailable: Backed backend failure"));

        assertThatThrownBy(() -> orchestrationService.generateAdvisory(request, userId))
                .isInstanceOf(AdvisoryGenerationException.class)
                .hasMessageContaining("Failed to generate agricultural advisory due to an internal error.");
    }

    @Test
    @DisplayName("Gemini Read Timeout is caught and wrapped safely")
    void geminiTimeoutHandledSafely() {
        when(contextAssembler.assemble(any(), any())).thenReturn(
                AdvisoryContext.builder()
                        .question(request.getQuestion())
                        .farmContext(FarmContextResponse.builder().build())
                        .retrievedKnowledge(List.of())
                        .build()
        );

        when(chatModel.call(any(Prompt.class))).thenThrow(new RuntimeException("SocketTimeoutException: Read timed out after 30000ms"));

        assertThatThrownBy(() -> orchestrationService.generateAdvisory(request, userId))
                .isInstanceOf(AdvisoryGenerationException.class)
                .hasMessageContaining("Failed to generate agricultural advisory due to an internal error.");
    }

    @Test
    @DisplayName("Gemini empty response is caught with explicit exception")
    void geminiEmptyResponseHandledSafely() {
        when(contextAssembler.assemble(any(), any())).thenReturn(
                AdvisoryContext.builder()
                        .question(request.getQuestion())
                        .farmContext(FarmContextResponse.builder().build())
                        .retrievedKnowledge(List.of())
                        .build()
        );

        when(chatModel.call(any(Prompt.class))).thenReturn(new ChatResponse(Collections.emptyList()));

        assertThatThrownBy(() -> orchestrationService.generateAdvisory(request, userId))
                .isInstanceOf(AdvisoryGenerationException.class)
                .hasMessageContaining("LLM returned an empty response.");
    }

    @Test
    @DisplayName("Disabled AI advisory throws explicit configuration exception")
    void disabledAiThrowsAdvisoryGenerationException() {
        properties.setEnabled(false);

        assertThatThrownBy(() -> orchestrationService.generateAdvisory(request, userId))
                .isInstanceOf(AdvisoryGenerationException.class)
                .hasMessageContaining("AI Advisory orchestration is currently disabled.");
    }

    @Test
    @DisplayName("Source Integrity: Deterministic mapping of retrieved knowledge chunks into response sources")
    void sourceIntegrityMaintained() {
        KnowledgeRetrievalResult chunk1 = KnowledgeRetrievalResult.builder()
                .knowledgeDocumentId("doc-101")
                .knowledgeChunkId("chunk-202")
                .chunkIndex(3)
                .title("TNAU Blackgram Manual")
                .source("Tamil Nadu Agricultural University")
                .sourceType("AGRICULTURAL_UNIVERSITY")
                .authority("TNAU Agritech")
                .version("2013")
                .publishedDate("2013-05-15")
                .lastVerifiedAt("2026-01-01T00:00:00Z")
                .score(0.234)
                .build();

        FarmContextResponse farmContext = FarmContextResponse.builder()
                .weather(WeatherResponse.builder().currentWeather(CurrentWeatherDto.builder().temperature(30.0).build()).build())
                .build();

        when(contextAssembler.assemble(any(), any())).thenReturn(
                AdvisoryContext.builder()
                        .question(request.getQuestion())
                        .farmContext(farmContext)
                        .retrievedKnowledge(List.of(chunk1))
                        .build()
        );

        when(chatModel.call(any(Prompt.class))).thenReturn(
                new ChatResponse(List.of(new Generation(new AssistantMessage("Apply spray per TNAU guide [Source 1]."))))
        );

        AdvisoryResponse response = orchestrationService.generateAdvisory(request, userId);

        assertThat(response).isNotNull();
        assertThat(response.getAnswer()).isEqualTo("Apply spray per TNAU guide [Source 1].");
        assertThat(response.isWeatherUsed()).isTrue();
        assertThat(response.getSources()).hasSize(1);

        AdvisorySource source = response.getSources().get(0);
        assertThat(source.getKnowledgeDocumentId()).isEqualTo("doc-101");
        assertThat(source.getKnowledgeChunkId()).isEqualTo("chunk-202");
        assertThat(source.getChunkIndex()).isEqualTo(3);
        assertThat(source.getTitle()).isEqualTo("TNAU Blackgram Manual");
        assertThat(source.getSource()).isEqualTo("Tamil Nadu Agricultural University");
        assertThat(source.getScore()).isEqualTo(0.234);
    }

    @Test
    @DisplayName("Source Integrity: Empty retrieval does NOT fabricate sources and marks weatherUsed appropriately")
    void emptyRetrievalProducesNoFakeSources() {
        FarmContextResponse farmContext = FarmContextResponse.builder()
                .weather(null) // Weather unavailable
                .build();

        when(contextAssembler.assemble(any(), any())).thenReturn(
                AdvisoryContext.builder()
                        .question(request.getQuestion())
                        .farmContext(farmContext)
                        .retrievedKnowledge(Collections.emptyList())
                        .build()
        );

        when(chatModel.call(any(Prompt.class))).thenReturn(
                new ChatResponse(List.of(new Generation(new AssistantMessage("I do not have sufficient agricultural knowledge to answer."))))
        );

        AdvisoryResponse response = orchestrationService.generateAdvisory(request, userId);

        assertThat(response).isNotNull();
        assertThat(response.getSources()).isEmpty(); // Zero fake citations
        assertThat(response.isWeatherUsed()).isFalse();
    }

    @Test
    @DisplayName("Farm context authorization boundary: Unauthorized user access denied bubbles up before AI reasoning")
    void farmAuthorizationEnforcedBeforeAiReasoning() {
        when(contextAssembler.assemble(any(), any())).thenThrow(new AccessDeniedException("Access denied to this farm context"));

        assertThatThrownBy(() -> orchestrationService.generateAdvisory(request, userId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied to this farm context");
    }

    @Test
    @DisplayName("Vector store failure during retrieval is caught and mapped safely without exposing SQL")
    void vectorStoreFailureHandledSafely() {
        when(contextAssembler.assemble(any(), any())).thenThrow(new RuntimeException("Vector database query failed: Connection refused to postgres:5432"));

        assertThatThrownBy(() -> orchestrationService.generateAdvisory(request, userId))
                .isInstanceOf(AdvisoryGenerationException.class)
                .hasMessageContaining("Failed to generate agricultural advisory due to an internal error.")
                .satisfies(e -> {
                    // Safe error: No database connection string or port exposed in message
                    assertThat(e.getMessage()).doesNotContain("postgres:5432");
                    assertThat(e.getMessage()).doesNotContain("Connection refused");
                });
    }
}
