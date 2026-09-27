package com.smartfarm.features.knowledge.dto;

import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeDocumentFilter {
    private String query;
    private String title;
    private String source;
    private SourceType sourceType;
    private String authority;
    private KnowledgeLanguage language;
    private String crop;
    private KnowledgeTopic topic;
    private DocumentStatus status;
    private String version;
}
