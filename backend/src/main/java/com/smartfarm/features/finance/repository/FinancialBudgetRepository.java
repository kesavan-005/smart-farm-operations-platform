package com.smartfarm.features.finance.repository;

import com.smartfarm.features.finance.domain.FinancialBudget;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FinancialBudgetRepository extends JpaRepository<FinancialBudget, UUID> {
    List<FinancialBudget> findByFarmId(UUID farmId);

    @Query("SELECT b FROM FinancialBudget b WHERE b.farm.id = :farmId AND b.category = :category " +
           "AND :date BETWEEN b.startDate AND b.endDate")
    Optional<FinancialBudget> findActiveBudget(
            @Param("farmId") UUID farmId,
            @Param("category") String category,
            @Param("date") LocalDate date);
}
