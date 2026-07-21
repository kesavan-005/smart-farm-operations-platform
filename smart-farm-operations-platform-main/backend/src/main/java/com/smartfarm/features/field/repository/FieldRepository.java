package com.smartfarm.features.field.repository;

import com.smartfarm.features.field.domain.Field;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FieldRepository extends JpaRepository<Field, UUID>, JpaSpecificationExecutor<Field> {
    Optional<Field> findByFieldCode(String fieldCode);
    boolean existsByFieldCode(String fieldCode);
}
