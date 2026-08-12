package com.smartfarm.features.inventory.repository;

import com.smartfarm.features.inventory.domain.StockTransaction;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, UUID> {
    List<StockTransaction> findByInventoryItemIdOrderByCreatedAtDesc(UUID itemId);
}
