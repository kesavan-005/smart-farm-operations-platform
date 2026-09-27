package com.smartfarm.features.knowledge.runner;

import com.smartfarm.features.knowledge.config.KnowledgeSeedProperties;
import com.smartfarm.features.knowledge.dto.KnowledgeSeedResult;
import com.smartfarm.features.knowledge.service.KnowledgeSeedService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Controlled startup runner that executes knowledge seeding ONLY when explicitly enabled
 * via configuration (e.g. {@code smartfarm.knowledge.seed.enabled=true}).
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "smartfarm.knowledge.seed", name = "enabled", havingValue = "true")
public class KnowledgeSeedRunner implements ApplicationRunner {

    private final KnowledgeSeedService seedService;
    private final KnowledgeSeedProperties seedProperties;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Knowledge seed enabled. Starting controlled knowledge seeding from '{}'...", seedProperties.getLocation());
        KnowledgeSeedResult result = seedService.seedFromConfiguredLocation();
        log.info("Knowledge seed execution completed: {}", result.toSummaryString());
    }
}
