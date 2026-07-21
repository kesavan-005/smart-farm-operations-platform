package com.smartfarm.features.crop.repository;

import com.smartfarm.features.crop.domain.Crop;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CropRepository extends JpaRepository<Crop, UUID>, JpaSpecificationExecutor<Crop> {
}
