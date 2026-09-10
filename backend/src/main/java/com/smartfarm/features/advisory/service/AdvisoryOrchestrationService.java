package com.smartfarm.features.advisory.service;

import com.smartfarm.features.advisory.config.SmartFarmAiProperties;
import com.smartfarm.features.advisory.dto.AdvisoryContext;
import com.smartfarm.features.advisory.dto.AdvisoryRequest;
import com.smartfarm.features.advisory.dto.AdvisoryResponse;
import com.smartfarm.features.advisory.dto.AdvisorySource;
import com.smartfarm.features.advisory.exception.AdvisoryGenerationException;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdvisoryOrchestrationService {

    private final SmartFarmAiProperties properties;
    private final ContextAssembler contextAssembler;
    private final GroundedPromptBuilder promptBuilder;
    private final ChatModel chatModel;

    public AdvisoryResponse generateAdvisory(AdvisoryRequest request, UUID userId) {
        if (!properties.isEnabled()) {
            throw new AdvisoryGenerationException("AI Advisory orchestration is currently disabled.");
        }

        if (request.getFarmId() == null) {
            throw new IllegalArgumentException("farmId is required");
        }
        if (request.getQuestion() == null || request.getQuestion().isBlank()) {
            throw new IllegalArgumentException("question must not be blank");
        }

        try {
            // 1. Build context (includes authorization & semantic retrieval)
            AdvisoryContext context = contextAssembler.assemble(request, userId);

            // 2. Build prompt
            Prompt prompt = promptBuilder.buildPrompt(context);

            // 3. Override options with our custom config
            OpenAiChatOptions options = OpenAiChatOptions.builder()
                    .temperature(properties.getTemperature())
                    .build();

            // Create a new Prompt that includes our options
            Prompt promptWithOptions = new Prompt(prompt.getInstructions(), options);

            // 4. Call LLM
            ChatResponse chatResponse = chatModel.call(promptWithOptions);
            
            if (chatResponse == null || chatResponse.getResult() == null || chatResponse.getResult().getOutput() == null) {
                throw new AdvisoryGenerationException("LLM returned an empty response.");
            }

            String answer = chatResponse.getResult().getOutput().getText();

            // 5. Build and attach deterministic sources
            List<AdvisorySource> sources = mapSources(context.getRetrievedKnowledge());
            
            boolean weatherUsed = context.getFarmContext().getWeather() != null;

            return AdvisoryResponse.builder()
                    .answer(answer)
                    .sources(sources)
                    .weatherUsed(weatherUsed)
                    .build();
                    
        } catch (IllegalArgumentException | SecurityException e) {
            // Let validation and security exceptions bubble up naturally
            throw e;
        } catch (org.springframework.security.access.AccessDeniedException e) {
            throw e;
        } catch (com.smartfarm.common.exception.ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to generate advisory", e);
            throw new AdvisoryGenerationException("Failed to generate agricultural advisory due to an internal error.", e);
        }
    }

    private List<AdvisorySource> mapSources(List<KnowledgeRetrievalResult> retrievalResults) {
        if (retrievalResults == null || retrievalResults.isEmpty()) {
            return Collections.emptyList();
        }

        return retrievalResults.stream()
                .map(res -> AdvisorySource.builder()
                        .knowledgeDocumentId(res.getKnowledgeDocumentId())
                        .knowledgeChunkId(res.getKnowledgeChunkId())
                        .chunkIndex(res.getChunkIndex())
                        .title(res.getTitle())
                        .source(res.getSource())
                        .sourceType(res.getSourceType() != null ? com.smartfarm.features.knowledge.domain.SourceType.valueOf(res.getSourceType()) : null)
                        .authority(res.getAuthority())
                        .version(res.getVersion())
                        .publishedDate(res.getPublishedDate() != null ? java.time.LocalDate.parse(res.getPublishedDate()) : null)
                        .lastVerifiedAt(res.getLastVerifiedAt() != null ? java.time.Instant.parse(res.getLastVerifiedAt()) : null)
                        .score(res.getScore())
                        .build())
                .collect(Collectors.toList());
    }
}
