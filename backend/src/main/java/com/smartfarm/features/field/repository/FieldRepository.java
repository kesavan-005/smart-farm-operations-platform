package com.smartfarm.features.field.repository;

import com.smartfarm.features.field.domain.Field;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FieldRepository extends JpaRepository<Field, UUID>, JpaSpecificationExecutor<Field> {

    // ── Legacy global lookup (kept for backward compat) ──────────────────────
    Optional<Field> findByFieldCode(String fieldCode);
    boolean existsByFieldCode(String fieldCode);

    // ── Farm-scoped lookups (preferred — enforces farm isolation) ─────────────
    Optional<Field> findByFarmIdAndFieldCode(UUID farmId, String fieldCode);
    boolean existsByFarmIdAndFieldCode(UUID farmId, String fieldCode);

    /**
     * Returns the maximum sequence number ever assigned for a given farm,
     * across all field codes matching the pattern &lt;anything&gt;-F&lt;digits&gt;.
     * Includes soft-deleted fields so previously used codes are NEVER reused.
     * Returns 0 when no fields (with the new format) exist for the farm yet.
     *
     * Example: for codes FARM-F01, FARM-F02, FARM-F05 → returns 5.
     */
    @Query(value = """
        SELECT COALESCE(
            MAX(
                CAST(
                    REGEXP_REPLACE(field_code, '^.+-F', '') AS INTEGER
                )
            ),
            0
        )
        FROM fields
        WHERE farm_id = :farmId
          AND field_code ~ '^.+-F[0-9]+$'
        """, nativeQuery = true)
    int findMaxFieldSequenceForFarm(@Param("farmId") UUID farmId);
}
