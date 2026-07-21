package com.smartfarm.features.finance.repository;

import com.smartfarm.features.finance.domain.FinancialTransaction;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, UUID> {
    List<FinancialTransaction> findByFarmIdAndDeletedFalseOrderByTransactionDateDesc(UUID farmId);

    Page<FinancialTransaction> findByFarmIdAndDeletedFalse(UUID farmId, Pageable pageable);

    @Query("SELECT t FROM FinancialTransaction t WHERE t.farm.id = :farmId AND t.deleted = false " +
           "AND (:type IS NULL OR t.transactionType = :type) " +
           "AND (:category IS NULL OR t.category = :category) " +
           "ORDER BY t.transactionDate DESC")
    Page<FinancialTransaction> findWithFilters(
            @Param("farmId") UUID farmId,
            @Param("type") String type,
            @Param("category") String category,
            Pageable pageable);
}
