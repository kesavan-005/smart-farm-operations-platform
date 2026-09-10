package com.smartfarm.features.advisory.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.openai.OpenAiEmbeddingModel;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.transformers.TransformersEmbeddingModel;

@Slf4j
@Configuration
public class AIProviderConfig {

    @Bean
    public EmbeddingModel embeddingModel() {
        log.info("Initializing local TransformersEmbeddingModel (all-MiniLM-L6-v2, 384 dimensions)...");
        TransformersEmbeddingModel embeddingModel = new TransformersEmbeddingModel();
        try {
            embeddingModel.afterPropertiesSet();
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize TransformersEmbeddingModel", e);
        }
        return embeddingModel;
    }



    @Bean
    @ConditionalOnProperty(name = "AI_PROVIDER", havingValue = "openai", matchIfMissing = true)
    public ChatModel openAiChatModel(@Value("${OPENAI_API_KEY:}") String apiKey) {
        log.info("Initializing OpenAI ChatModel...");
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("OPENAI_API_KEY is not set or blank. Advisory requests will fail.");
            apiKey = "dummy-key"; // Prevent startup failure, let it fail on request
        }
        OpenAiApi openAiApi = OpenAiApi.builder().apiKey(apiKey).build();
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model("gpt-4o-mini")
                .temperature(0.7)
                .build();
        return OpenAiChatModel.builder()
                .openAiApi(openAiApi)
                .defaultOptions(options)
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "AI_PROVIDER", havingValue = "gemini")
    public ChatModel geminiChatModel(@Value("${GEMINI_API_KEY:}") String apiKey) {
        log.info("Initializing Gemini ChatModel via OpenAI compatibility layer...");
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY is not set or blank. Advisory requests will fail.");
            apiKey = "dummy-key";
        }
        // Use Gemini's OpenAI-compatible endpoint
        OpenAiApi geminiApi = OpenAiApi.builder()
                .baseUrl("https://generativelanguage.googleapis.com/v1beta/openai")
                .completionsPath("/chat/completions")
                .apiKey(apiKey)
                .build();
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model("gemini-3.5-flash")
                .temperature(0.7)
                .build();
        return OpenAiChatModel.builder()
                .openAiApi(geminiApi)
                .defaultOptions(options)
                .build();
    }
}
