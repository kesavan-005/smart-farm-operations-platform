package com.smartfarm.features.knowledge;

import static org.assertj.core.api.Assertions.assertThat;

import com.smartfarm.features.knowledge.service.DeterministicChunker;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Phase 3B - Deterministic Chunker Unit Tests")
class DeterministicChunkerTest {

    private DeterministicChunker chunker;

    @BeforeEach
    void setUp() {
        chunker = new DeterministicChunker();
    }

    @Test
    @DisplayName("Deterministic chunking: identical input produces identical chunks")
    void testDeterministicChunking() {
        String content = "Paragraph 1: Soil preparation is essential for cotton farming. Ensure proper tillage and organic matter addition.\n\n"
                + "Paragraph 2: Pest control strategy. Monitor for bollworms and aphids regularly during early growth stage.\n\n"
                + "Paragraph 3: Harvesting practices. Pick cotton when bolls are fully opened and dry.";

        List<String> chunks1 = chunker.chunk(content, 120, 20);
        List<String> chunks2 = chunker.chunk(content, 120, 20);

        assertThat(chunks1).isNotEmpty();
        assertThat(chunks1).isEqualTo(chunks2);
        assertThat(chunks1.size()).isGreaterThan(1);
    }

    @Test
    @DisplayName("Content smaller than chunk size produces single chunk")
    void testSmallContentSingleChunk() {
        String smallText = "Short agricultural advice note.";
        List<String> chunks = chunker.chunk(smallText, 500, 50);

        assertThat(chunks).hasSize(1);
        assertThat(chunks.get(0)).isEqualTo(smallText);
    }

    @Test
    @DisplayName("Empty or blank content returns empty chunk list")
    void testEmptyContentReturnsEmptyList() {
        assertThat(chunker.chunk("", 100, 10)).isEmpty();
        assertThat(chunker.chunk(null, 100, 10)).isEmpty();
    }
}
