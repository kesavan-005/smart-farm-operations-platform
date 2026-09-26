package com.smartfarm.features.knowledge;

import static org.assertj.core.api.Assertions.assertThat;

import com.smartfarm.features.knowledge.service.TextNormalizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Phase 3B - Text Normalizer Unit Tests")
class TextNormalizerTest {

    private TextNormalizer normalizer;

    @BeforeEach
    void setUp() {
        normalizer = new TextNormalizer();
    }

    @Test
    @DisplayName("Normalizes line endings, trims lines, and collapses extra blank lines")
    void testNormalizeText() {
        String rawInput = "  Paddy Cultivation Guide  \r\n\r\n\r\n"
                + "Section 1: Soil Preparation   \r\n"
                + "Paddy requires well-drained clay loam soil.  \r\n\r\n\r\n\r\n"
                + "Section 2: Irrigation Management   ";

        String normalized = normalizer.normalize(rawInput);

        assertThat(normalized).startsWith("Paddy Cultivation Guide");
        assertThat(normalized).endsWith("Section 2: Irrigation Management");
        assertThat(normalized).doesNotContain("\r");
        assertThat(normalized).doesNotContain("\n\n\n");
        assertThat(normalized).contains("Section 1: Soil Preparation\nPaddy requires well-drained clay loam soil.");
    }

    @Test
    @DisplayName("Handles null and blank strings gracefully")
    void testNullAndBlankInput() {
        assertThat(normalizer.normalize(null)).isEqualTo("");
        assertThat(normalizer.normalize("   \n\t   ")).isEqualTo("");
    }
}
