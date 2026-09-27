package com.smartfarm.features.knowledge.repository;

import com.smartfarm.features.knowledge.domain.KnowledgeDocument;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentFilter;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public class KnowledgeDocumentSpecification {

    public static Specification<KnowledgeDocument> withFilter(KnowledgeDocumentFilter filter) {
        return (root, query, cb) -> {
            if (filter == null) {
                return cb.conjunction();
            }

            List<Predicate> predicates = new ArrayList<>();

            // Free-text query matching across key fields
            if (StringUtils.hasText(filter.getQuery())) {
                String pattern = "%" + filter.getQuery().trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate sourceMatch = cb.like(cb.lower(root.get("source")), pattern);
                Predicate authorityMatch = cb.like(cb.lower(root.get("authority")), pattern);
                Predicate cropMatch = cb.like(cb.lower(root.get("crop")), pattern);
                predicates.add(cb.or(titleMatch, sourceMatch, authorityMatch, cropMatch));
            }

            // Structured field filters
            if (StringUtils.hasText(filter.getTitle())) {
                String pattern = "%" + filter.getTitle().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("title")), pattern));
            }

            if (StringUtils.hasText(filter.getSource())) {
                String pattern = "%" + filter.getSource().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("source")), pattern));
            }

            if (filter.getSourceType() != null) {
                predicates.add(cb.equal(root.get("sourceType"), filter.getSourceType()));
            }

            if (StringUtils.hasText(filter.getAuthority())) {
                String pattern = "%" + filter.getAuthority().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("authority")), pattern));
            }

            if (filter.getLanguage() != null) {
                predicates.add(cb.equal(root.get("language"), filter.getLanguage()));
            }

            if (StringUtils.hasText(filter.getCrop())) {
                String pattern = "%" + filter.getCrop().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("crop")), pattern));
            }

            if (filter.getTopic() != null) {
                predicates.add(cb.equal(root.get("topic"), filter.getTopic()));
            }

            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            if (StringUtils.hasText(filter.getVersion())) {
                predicates.add(cb.equal(cb.lower(root.get("version")), filter.getVersion().trim().toLowerCase()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
