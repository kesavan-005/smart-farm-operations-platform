package com.smartfarm.features.advisory.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.model.ChatModel;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AIProviderConfigTest {

    private final AIProviderConfig config = new AIProviderConfig();

    @Test
    @DisplayName("geminiChatModel should throw IllegalStateException when API key is null")
    void geminiChatModel_ThrowsException_WhenApiKeyIsNull() {
        assertThatThrownBy(() -> config.geminiChatModel(null, "gemini-3.6-flash"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Google Gemini API key is missing");
    }

    @Test
    @DisplayName("geminiChatModel should throw IllegalStateException when API key is blank")
    void geminiChatModel_ThrowsException_WhenApiKeyIsBlank() {
        assertThatThrownBy(() -> config.geminiChatModel("   ", "gemini-3.6-flash"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Google Gemini API key is missing");
    }

    @Test
    @DisplayName("geminiChatModel should successfully create ChatModel when API key is provided")
    void geminiChatModel_CreatesChatModel_WhenApiKeyProvided() {
        ChatModel chatModel = config.geminiChatModel("test-gemini-key", "gemini-3.6-flash");
        assertThat(chatModel).isNotNull();
    }

    @Test
    @DisplayName("openAiChatModel method should not exist in AIProviderConfig")
    void openAiChatModel_DoesNotExist() {
        Method[] methods = AIProviderConfig.class.getDeclaredMethods();
        for (Method method : methods) {
            assertThat(method.getName()).isNotEqualTo("openAiChatModel");
        }
    }
}
