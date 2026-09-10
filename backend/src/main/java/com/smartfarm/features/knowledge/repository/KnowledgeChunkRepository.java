package com.smartfarm.features.knowledge.repository;

import com.smartfarm.features.knowledge.domain.KnowledgeChunk;
import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KnowledgeChunkRepository extends JpaRepository<KnowledgeChunk, UUID> {
    List<KnowledgeChunk> findByDocumentOrderByChunkIndexAsc(KnowledgeDocument document);
    List<KnowledgeChunk> findByDocument_IdOrderByChunkIndexAsc(UUID documentId);
    Optional<KnowledgeChunk> findByDocument_IdAndChunkIndex(UUID documentId, Integer chunkIndex);
    void deleteByDocument_Id(UUID documentId);
}
