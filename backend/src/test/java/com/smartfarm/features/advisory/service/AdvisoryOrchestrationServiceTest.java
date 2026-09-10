package com.smartfarm.features.advisory.service;

import com.smartfarm.features.advisory.config.SmartFarmAiProperties;
import com.smartfarm.features.advisory.dto.AdvisoryContext;
import com.smartfarm.features.advisory.dto.AdvisoryRequest;
import com.smartfarm.features.advisory.dto.AdvisoryResponse;
import com.smartfarm.features.advisory.exception.AdvisoryGenerationException;
import com.smartfarm.features.farm.dto.context.FarmContextResponse;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class AdvisoryOrchestrationServiceTest {

    private SmartFarmAiProperties properties;
    private ContextAssembler contextAssembler;
    private GroundedPromptBuilder promptBuilder;
    private ChatModel chatModel;

    private AdvisoryOrchestrationService orchestrationService;

    private UUID farmId;
    private UUID userId;
    private AdvisoryRequest request;
    private AdvisoryContext context;

    private boolean throwAccessDenied;
    private ChatResponse mockedChatResponse;
    private RuntimeException mockedChatException;
    private Prompt capturedPrompt;

    @BeforeEach
    void setUp() {
        farmId = UUID.randomUUID();
        userId = UUID.randomUUID();
        
        request = AdvisoryRequest.builder()
                .farmId(farmId)
                .question("What is the best fertilizer?")
                .build();
                
        context = AdvisoryContext.builder()
                .question("What is the best fertilizer?")
                .farmContext(new FarmContextResponse())
                .retrievedKnowledge(List.of(
                        KnowledgeRetrievalResult.builder()
                                .knowledgeDocumentId("doc1")
                                .content("Use NPK")
                                .build()
                ))
                .build();
                
        properties = new SmartFarmAiProperties();
        properties.setEnabled(true);
        properties.setModel("gpt-4o-mini");
        properties.setTemperature(0.2);
        
        throwAccessDenied = false;
        mockedChatResponse = null;
        mockedChatException = null;
        capturedPrompt = null;
        
        contextAssembler = new ContextAssembler(null, null) {
            @Override
            public AdvisoryContext assemble(AdvisoryRequest req, UUID uId) {
                if (throwAccessDenied) throw new AccessDeniedException("Denied");
                return context;
            }
        };
        
        promptBuilder = new GroundedPromptBuilder() {
            @Override
            public Prompt buildPrompt(AdvisoryContext ctx) {
                return new Prompt("Test");
            }
        };
        
        chatModel = new ChatModel() {
            @Override
            public ChatResponse call(Prompt prompt) {
                capturedPrompt = prompt;
                if (mockedChatException != null) throw mockedChatException;
                return mockedChatResponse;
            }
        };
        
        orchestrationService = new AdvisoryOrchestrationService(properties, contextAssembler, promptBuilder, chatModel);
    }

    @Test
    void testGenerateAdvisory_DisabledThrowsException() {
        properties.setEnabled(false);
        assertThrows(AdvisoryGenerationException.class, () -> orchestrationService.generateAdvisory(request, userId));
        assertNull(capturedPrompt);
    }

    @Test
    void testGenerateAdvisory_NullFarmIdThrowsException() {
        request.setFarmId(null);
        assertThrows(IllegalArgumentException.class, () -> orchestrationService.generateAdvisory(request, userId));
        assertNull(capturedPrompt);
    }

    @Test
    void testGenerateAdvisory_BlankQuestionThrowsException() {
        request.setQuestion("   ");
        assertThrows(IllegalArgumentException.class, () -> orchestrationService.generateAdvisory(request, userId));
        assertNull(capturedPrompt);
    }

    @Test
    void testGenerateAdvisory_AccessDeniedPropagates() {
        throwAccessDenied = true;
        assertThrows(AccessDeniedException.class, () -> orchestrationService.generateAdvisory(request, userId));
        assertNull(capturedPrompt);
    }

    @Test
    void testGenerateAdvisory_Success() {
        AssistantMessage assistantMessage = new AssistantMessage("You should use NPK.");
        Generation generation = new Generation(assistantMessage);
        mockedChatResponse = new ChatResponse(List.of(generation));

        AdvisoryResponse response = orchestrationService.generateAdvisory(request, userId);

        assertNotNull(response);
        assertEquals("You should use NPK.", response.getAnswer());
        assertEquals(1, response.getSources().size());
        assertEquals("doc1", response.getSources().get(0).getKnowledgeDocumentId());
        assertFalse(response.isWeatherUsed());
        assertNotNull(capturedPrompt);
    }
    
    @Test
    void testGenerateAdvisory_EmptyLLMResponse() {
        mockedChatResponse = new ChatResponse(List.of());
        assertThrows(AdvisoryGenerationException.class, () -> orchestrationService.generateAdvisory(request, userId));
    }

    @Test
    void testGenerateAdvisory_ExceptionMapping() {
        mockedChatException = new RuntimeException("API Timeout");
        AdvisoryGenerationException ex = assertThrows(AdvisoryGenerationException.class, () -> orchestrationService.generateAdvisory(request, userId));
        assertTrue(ex.getMessage().contains("internal error"));
    }
}
