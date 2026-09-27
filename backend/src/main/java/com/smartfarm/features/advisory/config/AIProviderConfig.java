package com.smartfarm.features.advisory.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
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
    public ChatModel geminiChatModel(
            @Value("${GEMINI_API_KEY:${GOOGLE_API_KEY:}}") String apiKey,
            @Value("${smartfarm.ai.llm.model:gemini-3.6-flash}") String modelName) {
        log.info("Initializing Google Gemini ChatModel via OpenAI compatibility layer...");
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "Google Gemini API key is missing. Please configure GEMINI_API_KEY or GOOGLE_API_KEY in your environment or configuration. "
                    + "Smart Farm Advisory requires Google Gemini as the LLM provider.");
        }
        log.info("GEMINI_API_KEY = PRESENT");
        
        // Ensure model name is valid (fall back to gemini-3.6-flash if set to outdated default)
        String effectiveModel = (modelName == null || modelName.isBlank() || modelName.equals("gpt-4o-mini") || modelName.equals("gemini-3.5-flash"))
                ? "gemini-3.6-flash"
                : modelName;
        log.info("Using Gemini model: {}", effectiveModel);

        // Use Gemini's OpenAI-compatible endpoint
        OpenAiApi geminiApi = OpenAiApi.builder()
                .baseUrl("https://generativelanguage.googleapis.com/v1beta/openai")
                .completionsPath("/chat/completions")
                .apiKey(apiKey)
                .build();
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(effectiveModel)
                .temperature(0.7)
                .build();
        return OpenAiChatModel.builder()
                .openAiApi(geminiApi)
                .defaultOptions(options)
                .build();
    }
}
