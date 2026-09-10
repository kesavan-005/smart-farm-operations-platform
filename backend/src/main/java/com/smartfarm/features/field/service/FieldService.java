package com.smartfarm.features.field.service;

import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.field.domain.Field;
import com.smartfarm.features.field.dto.FieldRequest;
import com.smartfarm.features.field.dto.FieldResponse;
import com.smartfarm.features.field.mapper.FieldMapper;
import com.smartfarm.features.field.repository.FieldRepository;
import com.smartfarm.features.auth.security.FarmAuthorizationService;
import com.smartfarm.features.auth.domain.FarmModule;
import com.smartfarm.features.auth.domain.ModuleAccessLevel;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FieldService {

    private final FieldRepository fieldRepository;
    private final FarmRepository farmRepository;
    private final FieldMapper fieldMapper;
    private final FarmAuthorizationService farmAuthorizationService;

    // ── Field Code Generation ────────────────────────────────────────────────

    /**
     * Generates the next sequential field code for a given farm.
     *
     * Format: {@code <FARM_CODE>-F<NN>}
     * Examples: {@code FARM-RAMESH-01-F01}, {@code FARM-RAMESH-01-F10}
     *
     * Strategy:
     * 1. Query MAX sequence across ALL fields for this farm (including soft-deleted)
     *    so that previously used codes are NEVER reused.
     * 2. Increment by 1 and format with at least 2 digits (01, 02, … 09, 10, 100+).
     * 3. Return the candidate code — uniqueness is enforced by the DB constraint.
     */
    private String generateNextFieldCode(UUID farmId, String farmCode) {
        int maxSeq = fieldRepository.findMaxFieldSequenceForFarm(farmId);
        int nextSeq = maxSeq + 1;
        // String.format("%02d", n) gives "01"…"09" then "10", "100", etc.
        return farmCode + "-F" + String.format("%02d", nextSeq);
    }

    // ── CRUD operations ──────────────────────────────────────────────────────

    @Transactional
    public FieldResponse createField(FieldRequest request, UUID userId) {
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));

        if (!farmAuthorizationService.hasModuleAccess(userId, farm.getId(), FarmModule.OPERATIONS, ModuleAccessLevel.FULL_ACCESS)) {
            throw new AccessDeniedException("Access denied to create fields in this farm");
        }

        // Generate a safe, sequential, farm-scoped Field Code.
        // On a rare concurrency collision (two threads pick the same MAX),
        // the DB UNIQUE(farm_id, field_code) constraint fires a DataIntegrityViolationException.
        // We retry once with an incremented sequence — sufficient for normal farm usage.
        Field field = buildField(request, farm);
        try {
            field = fieldRepository.saveAndFlush(field);
            log.info("Created field {} with code: {}", field.getId(), field.getFieldCode());
        } catch (DataIntegrityViolationException ex) {
            log.warn("Field code collision detected for farm {}, retrying with next sequence", farm.getId());
            // Retry: re-read MAX after the winning insert has committed
            field = buildField(request, farm);
            field = fieldRepository.saveAndFlush(field);
            log.info("Created field {} with code (retry): {}", field.getId(), field.getFieldCode());
        }
        return fieldMapper.toResponse(field);
    }

    /** Build a new Field entity with a freshly generated field code. */
    private Field buildField(FieldRequest request, Farm farm) {
        String fieldCode = generateNextFieldCode(farm.getId(), farm.getFarmCode());
        Field field = fieldMapper.toEntity(request);
        field.setFarm(farm);
        field.setFieldCode(fieldCode);
        return field;
    }

    @Transactional(readOnly = true)
    public FieldResponse getFieldById(UUID id, UUID userId) {
        Field field = fieldRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Field not found"));

        if (!farmAuthorizationService.hasModuleAccess(userId, field.getFarm().getId(), FarmModule.OPERATIONS, ModuleAccessLevel.VIEW_ONLY)) {
            throw new AccessDeniedException("Access denied to view this field");
        }
        return fieldMapper.toResponse(field);
    }

    @Transactional(readOnly = true)
    public Page<FieldResponse> getFields(UUID userId, UUID farmId, String search, String status, Pageable pageable) {
        Specification<Field> spec = Specification.where(null);

        if (farmId != null) {
            if (!farmAuthorizationService.hasModuleAccess(userId, farmId, FarmModule.OPERATIONS, ModuleAccessLevel.VIEW_ONLY)) {
                throw new AccessDeniedException("Access denied to view fields in this farm");
            }
            spec = spec.and((root, query, cb) -> cb.equal(root.get("farm").get("id"), farmId));
        } else {
            // For dashboard: must be Owner OR we need to filter by accessible farms. 
            // Since we can't easily query all accessible farms from here, we'll ensure they are at least the owner.
            // Ideally, we'd look up userFarmRoleRepository for all farmIds they have access to.
            spec = spec.and((root, query, cb) -> cb.equal(root.get("farm").get("owner").get("id"), userId));
        }

        if (status != null && !status.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        if (search != null && !search.trim().isEmpty()) {
            String searchPattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), searchPattern),
                cb.like(cb.lower(root.get("fieldCode")), searchPattern)
            ));
        }

        return fieldRepository.findAll(spec, pageable).map(fieldMapper::toResponse);
    }

    @Transactional
    public FieldResponse updateField(UUID id, FieldRequest request, UUID userId) {
        Field field = fieldRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Field not found"));

        if (!farmAuthorizationService.hasModuleAccess(userId, field.getFarm().getId(), FarmModule.OPERATIONS, ModuleAccessLevel.FULL_ACCESS)) {
            throw new AccessDeniedException("Access denied to update this field");
        }

        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));

        if (!farm.getId().equals(field.getFarm().getId())) {
             if (!farmAuthorizationService.hasModuleAccess(userId, farm.getId(), FarmModule.OPERATIONS, ModuleAccessLevel.FULL_ACCESS)) {
                 throw new AccessDeniedException("Access denied to target farm");
             }
        }

        // fieldCode is ignored by the mapper (mapped as @Mapping(target="fieldCode", ignore=true))
        // so it is permanently immutable through the normal update API.
        fieldMapper.updateEntity(request, field);
        field.setFarm(farm);
        field = fieldRepository.save(field);
        return fieldMapper.toResponse(field);
    }

    @Transactional
    public void deleteField(UUID id, UUID userId) {
        Field field = fieldRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Field not found"));

        if (!farmAuthorizationService.hasModuleAccess(userId, field.getFarm().getId(), FarmModule.OPERATIONS, ModuleAccessLevel.FULL_ACCESS)) {
            throw new AccessDeniedException("Access denied to delete this field");
        }

        // Soft-delete: fieldCode is preserved in the record so the sequence
        // is never reused (findMaxFieldSequenceForFarm includes deleted rows).
        field.setDeleted(true);
        field.setDeletedAt(OffsetDateTime.now());
        fieldRepository.save(field);
        log.info("Soft-deleted field: {} (code: {})", id, field.getFieldCode());
    }
}
