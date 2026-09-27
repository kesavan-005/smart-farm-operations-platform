package com.smartfarm.features.knowledge.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class KnowledgeSeedPropertiesTest {

    @Test
    @DisplayName("KnowledgeSeedProperties has safe defaults")
    void testDefaults() {
        KnowledgeSeedProperties props = new KnowledgeSeedProperties();
        assertThat(props.isEnabled()).isFalse();
        assertThat(props.getLocation()).isEqualTo("classpath:knowledge-seed/");
        assertThat(props.getManifestFile()).isEqualTo("manifest.json");
    }

    @Test
    @DisplayName("KnowledgeSeedProperties custom setters work")
    void testCustomSetters() {
        KnowledgeSeedProperties props = new KnowledgeSeedProperties();
        props.setEnabled(true);
        props.setLocation("file:/custom/seed/");
        props.setManifestFile("custom-manifest.json");

        assertThat(props.isEnabled()).isTrue();
        assertThat(props.getLocation()).isEqualTo("file:/custom/seed/");
        assertThat(props.getManifestFile()).isEqualTo("custom-manifest.json");
    }
}
