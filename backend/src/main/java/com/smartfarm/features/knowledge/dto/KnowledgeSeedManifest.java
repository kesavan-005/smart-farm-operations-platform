package com.smartfarm.features.knowledge.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Manifest defining a batch of agricultural knowledge seed documents.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeSeedManifest {

    @Builder.Default
    private List<KnowledgeSeedItem> documents = new ArrayList<>();
}
