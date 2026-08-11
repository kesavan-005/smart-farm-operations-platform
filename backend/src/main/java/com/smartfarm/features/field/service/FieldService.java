package com.smartfarm.features.field.service;

import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.field.domain.Field;
import com.smartfarm.features.field.dto.FieldRequest;
import com.smartfarm.features.field.dto.FieldResponse;
import com.smartfarm.features.field.mapper.FieldMapper;
import com.smartfarm.features.field.repository.FieldRepository;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    @Transactional
    public FieldResponse createField(FieldRequest request, UUID ownerId) {
        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));

        if (!farm.getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied to this farm");
        }

        // Generate unique fieldCode
        String fieldCode = "FLD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        while (fieldRepository.existsByFieldCode(fieldCode)) {
            fieldCode = "FLD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        Field field = fieldMapper.toEntity(request);
        field.setFarm(farm);
        field.setFieldCode(fieldCode);
        field = fieldRepository.save(field);
        log.info("Created field with code: {}", fieldCode);
        return fieldMapper.toResponse(field);
    }

    @Transactional(readOnly = true)
    public FieldResponse getFieldById(UUID id, UUID ownerId) {
        Field field = fieldRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Field not found"));
        
        if (!field.getFarm().getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied to this field");
        }
        return fieldMapper.toResponse(field);
    }

    @Transactional(readOnly = true)
    public Page<FieldResponse> getFields(UUID ownerId, UUID farmId, String search, String status, Pageable pageable) {
        Specification<Field> spec = Specification.where((root, query, cb) -> 
            cb.equal(root.get("farm").get("owner").get("id"), ownerId)
        );

        if (farmId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("farm").get("id"), farmId));
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
    public FieldResponse updateField(UUID id, FieldRequest request, UUID ownerId) {
        Field field = fieldRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Field not found"));
        
        if (!field.getFarm().getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied to this field");
        }

        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        
        if (!farm.getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied to this farm");
        }

        fieldMapper.updateEntity(request, field);
        field.setFarm(farm);
        field = fieldRepository.save(field);
        return fieldMapper.toResponse(field);
    }

    @Transactional
    public void deleteField(UUID id, UUID ownerId) {
        Field field = fieldRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Field not found"));
        
        if (!field.getFarm().getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied to this field");
        }

        field.setDeleted(true);
        field.setDeletedAt(OffsetDateTime.now());
        fieldRepository.save(field);
        log.info("Soft deleted field: {}", id);
    }
}
