package com.smartfarm.features.farm.repository;

import com.smartfarm.features.farm.domain.Farm;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmRepository extends JpaRepository<Farm, UUID>, JpaSpecificationExecutor<Farm> {
    Optional<Farm> findByFarmCode(String farmCode);
    boolean existsByFarmCode(String farmCode);
}
