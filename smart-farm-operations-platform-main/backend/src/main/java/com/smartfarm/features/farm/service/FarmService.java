package com.smartfarm.features.farm.service;

import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.dto.FarmRequest;
import com.smartfarm.features.farm.dto.FarmResponse;
import com.smartfarm.features.farm.mapper.FarmMapper;
import com.smartfarm.features.farm.repository.FarmRepository;
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
public class FarmService {

    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final FarmMapper farmMapper;

    @Transactional
    public FarmResponse createFarm(FarmRequest request, UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Generate unique farmCode
        String farmCode = "FRM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        while (farmRepository.existsByFarmCode(farmCode)) {
            farmCode = "FRM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        Farm farm = farmMapper.toEntity(request);
        farm.setOwner(owner);
        farm.setFarmCode(farmCode);
        farm = farmRepository.save(farm);
        log.info("Created farm with code: {}", farmCode);
        return farmMapper.toResponse(farm);
    }

    @Transactional(readOnly = true)
    public FarmResponse getFarmById(UUID id, UUID ownerId) {
        Farm farm = farmRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        
        if (!farm.getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied to this farm");
        }
        return farmMapper.toResponse(farm);
    }

    @Transactional(readOnly = true)
    public Page<FarmResponse> getFarms(UUID ownerId, String search, String status, Pageable pageable) {
        Specification<Farm> spec = Specification.where((root, query, cb) -> 
            cb.equal(root.get("owner").get("id"), ownerId)
        );

        if (status != null && !status.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        if (search != null && !search.trim().isEmpty()) {
            String searchPattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), searchPattern),
                cb.like(cb.lower(root.get("village")), searchPattern),
                cb.like(cb.lower(root.get("taluk")), searchPattern),
                cb.like(cb.lower(root.get("district")), searchPattern),
                cb.like(cb.lower(root.get("state")), searchPattern),
                cb.like(cb.lower(root.get("farmCode")), searchPattern)
            ));
        }

        return farmRepository.findAll(spec, pageable).map(farmMapper::toResponse);
    }

    @Transactional
    public FarmResponse updateFarm(UUID id, FarmRequest request, UUID ownerId) {
        Farm farm = farmRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        
        if (!farm.getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied to this farm");
        }

        farmMapper.updateEntity(request, farm);
        farm = farmRepository.save(farm);
        return farmMapper.toResponse(farm);
    }

    @Transactional
    public void deleteFarm(UUID id, UUID ownerId) {
        Farm farm = farmRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        
        if (!farm.getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("Access denied to this farm");
        }

        farm.setDeleted(true);
        farm.setDeletedAt(OffsetDateTime.now());
        farmRepository.save(farm);
        log.info("Soft deleted farm: {}", id);
    }
}
