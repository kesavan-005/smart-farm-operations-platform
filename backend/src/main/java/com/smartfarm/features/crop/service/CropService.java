package com.smartfarm.features.crop.service;

import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.crop.domain.Crop;
import com.smartfarm.features.crop.dto.CropRequest;
import com.smartfarm.features.crop.dto.CropResponse;
import com.smartfarm.features.crop.mapper.CropMapper;
import com.smartfarm.features.crop.repository.CropRepository;
import com.smartfarm.features.field.domain.Field;
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
public class CropService {

    private final CropRepository cropRepository;
    private final FieldRepository fieldRepository;
    private final CropMapper cropMapper;

    @Transactional
    public CropResponse createCrop(CropRequest request, UUID ownerId) {
        Field field = fieldRepository.findById(request.getFieldId())
                .orElseThrow(() -> new ResourceNotFoundException("Field not found"));

        if (!field.getFarm().getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied to this field");
        }

        Crop crop = cropMapper.toEntity(request);
        crop.setField(field);
        crop = cropRepository.save(crop);
        log.info("Created crop: {}", crop.getId());
        return cropMapper.toResponse(crop);
    }

    @Transactional(readOnly = true)
    public CropResponse getCropById(UUID id, UUID ownerId) {
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found"));

        if (!crop.getField().getFarm().getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied to this crop");
        }
        return cropMapper.toResponse(crop);
    }

    @Transactional(readOnly = true)
    public Page<CropResponse> getCrops(UUID ownerId, UUID fieldId, String search, String status, Pageable pageable) {
        Specification<Crop> spec = Specification.where((root, query, cb) -> 
            cb.equal(root.get("field").get("farm").get("owner").get("id"), ownerId)
        );

        if (fieldId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("field").get("id"), fieldId));
        }

        if (status != null && !status.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        if (search != null && !search.trim().isEmpty()) {
            String searchPattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), searchPattern),
                cb.like(cb.lower(root.get("variety")), searchPattern),
                cb.like(cb.lower(root.get("season")), searchPattern)
            ));
        }

        return cropRepository.findAll(spec, pageable).map(cropMapper::toResponse);
    }

    @Transactional
    public CropResponse updateCrop(UUID id, CropRequest request, UUID ownerId) {
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found"));

        if (!crop.getField().getFarm().getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied to this crop");
        }

        Field field = fieldRepository.findById(request.getFieldId())
                .orElseThrow(() -> new ResourceNotFoundException("Field not found"));

        if (!field.getFarm().getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied to this field");
        }

        cropMapper.updateEntity(request, crop);
        crop.setField(field);
        crop = cropRepository.save(crop);
        return cropMapper.toResponse(crop);
    }

    @Transactional
    public void deleteCrop(UUID id, UUID ownerId) {
        Crop crop = cropRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found"));

        if (!crop.getField().getFarm().getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied to this crop");
        }

        crop.setDeleted(true);
        crop.setDeletedAt(OffsetDateTime.now());
        cropRepository.save(crop);
        log.info("Soft deleted crop: {}", id);
    }
}
