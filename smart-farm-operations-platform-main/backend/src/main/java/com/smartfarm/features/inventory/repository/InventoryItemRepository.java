package com.smartfarm.features.inventory.repository;

import com.smartfarm.features.inventory.domain.InventoryItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID> {
    List<InventoryItem> findByFarmIdAndDeletedFalse(UUID farmId);
    Optional<InventoryItem> findBySkuAndDeletedFalse(String sku);
}
