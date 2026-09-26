package com.smartfarm.features.advisory.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "smartfarm.ai.llm")
public class SmartFarmAiProperties {

    /**
     * Whether the LLM orchestration is enabled.
     */
    private boolean enabled = true;

    /**
     * The chat model to use (e.g. gpt-4o-mini).
     */
    private String model = "gpt-4o-mini";

    /**
     * The temperature to use for the chat model.
     */
    private double temperature = 0.2;
}
