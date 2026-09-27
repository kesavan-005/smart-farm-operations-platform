package com.smartfarm.features.knowledge.evaluation;

import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Phase 2.8: Represents an evaluation test case for evaluating agricultural RAG retrieval.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetrievalEvaluationCase {

    private String id;
    private String category;
    private String question;
    private String expectedDocumentTitle;
    private List<String> acceptableDocumentTitles;
    private String expectedSource;
    private String expectedCrop;
    private KnowledgeTopic expectedTopic;
    private KnowledgeLanguage language;
    private boolean expectNoResult;
    private String description;

    public boolean matchesDocument(String title) {
        if (title == null) {
            return false;
        }
        if (expectedDocumentTitle != null && expectedDocumentTitle.equalsIgnoreCase(title)) {
            return true;
        }
        if (acceptableDocumentTitles != null) {
            return acceptableDocumentTitles.stream().anyMatch(title::equalsIgnoreCase);
        }
        return false;
    }
}
