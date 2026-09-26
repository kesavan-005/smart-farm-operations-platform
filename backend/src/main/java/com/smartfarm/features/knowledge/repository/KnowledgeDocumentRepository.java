package com.smartfarm.features.knowledge.repository;

import com.smartfarm.features.knowledge.domain.DocumentStatus;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.domain.KnowledgeLanguage;
import com.smartfarm.features.knowledge.domain.KnowledgeTopic;
import com.smartfarm.features.knowledge.domain.SourceType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocument, UUID>, JpaSpecificationExecutor<KnowledgeDocument> {
    List<KnowledgeDocument> findByStatus(DocumentStatus status);
    List<KnowledgeDocument> findByCrop(String crop);
    List<KnowledgeDocument> findByTopic(KnowledgeTopic topic);
    List<KnowledgeDocument> findByLanguage(KnowledgeLanguage language);
    List<KnowledgeDocument> findBySourceType(SourceType sourceType);
}
