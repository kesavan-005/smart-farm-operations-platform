package com.smartfarm.features.inventory.repository;

import com.smartfarm.features.inventory.domain.Warehouse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, UUID> {
    List<Warehouse> findByFarmIdAndDeletedFalse(UUID farmId);
}
