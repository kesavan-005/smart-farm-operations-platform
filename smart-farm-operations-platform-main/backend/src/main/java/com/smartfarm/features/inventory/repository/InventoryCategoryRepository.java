package com.smartfarm.features.inventory.repository;

import com.smartfarm.features.inventory.domain.InventoryCategory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryCategoryRepository extends JpaRepository<InventoryCategory, UUID> {
    List<InventoryCategory> findByFarmIdAndDeletedFalse(UUID farmId);
}
