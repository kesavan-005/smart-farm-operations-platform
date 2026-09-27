package com.smartfarm.features.knowledge.runner;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartfarm.features.knowledge.config.KnowledgeSeedProperties;
import com.smartfarm.features.knowledge.dto.KnowledgeSeedResult;
import com.smartfarm.features.knowledge.service.KnowledgeSeedService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;

@ExtendWith(MockitoExtension.class)
class KnowledgeSeedRunnerTest {

    @Mock
    private KnowledgeSeedService seedService;

    @Mock
    private KnowledgeSeedProperties seedProperties;

    @InjectMocks
    private KnowledgeSeedRunner seedRunner;

    @Test
    @DisplayName("KnowledgeSeedRunner invokes seedFromConfiguredLocation when run")
    void testRunnerExecutesSeeding() {
        when(seedProperties.getLocation()).thenReturn("classpath:knowledge-seed/");
        when(seedService.seedFromConfiguredLocation()).thenReturn(KnowledgeSeedResult.builder().processed(0).build());

        seedRunner.run(new DefaultApplicationArguments());

        verify(seedService).seedFromConfiguredLocation();
    }
}
