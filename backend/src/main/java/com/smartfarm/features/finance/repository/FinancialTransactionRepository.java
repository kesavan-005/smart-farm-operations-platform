package com.smartfarm.features.finance.repository;

import com.smartfarm.features.finance.domain.FinancialTransaction;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
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

    // Dashboard aggregate queries — avoid loading all transactions into memory
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM FinancialTransaction t " +
           "WHERE t.farm.id = :farmId AND t.deleted = false " +
           "AND t.transactionType = :type AND t.transactionDate >= :from AND t.transactionDate < :to")
    BigDecimal sumByTypeAndDateRange(@Param("farmId") UUID farmId,
                                     @Param("type") String type,
                                     @Param("from") OffsetDateTime from,
                                     @Param("to") OffsetDateTime to);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM FinancialTransaction t " +
           "WHERE t.farm.id = :farmId AND t.deleted = false AND t.transactionType = :type")
    BigDecimal sumByType(@Param("farmId") UUID farmId, @Param("type") String type);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM FinancialTransaction t " +
           "WHERE t.farm.id = :farmId AND t.deleted = false AND t.status = :status")
    BigDecimal sumByStatus(@Param("farmId") UUID farmId, @Param("status") String status);

    @Query("SELECT t.category AS category, COALESCE(SUM(t.amount), 0) AS total " +
           "FROM FinancialTransaction t WHERE t.farm.id = :farmId AND t.deleted = false " +
           "AND t.transactionType = :type GROUP BY t.category")
    List<Object[]> sumGroupedByCategory(@Param("farmId") UUID farmId, @Param("type") String type);

    @Query("SELECT FUNCTION('TO_CHAR', t.transactionDate, 'YYYY-MM') AS month, " +
           "t.transactionType AS type, COALESCE(SUM(t.amount), 0) AS total " +
           "FROM FinancialTransaction t WHERE t.farm.id = :farmId AND t.deleted = false " +
           "AND t.transactionDate >= :from GROUP BY FUNCTION('TO_CHAR', t.transactionDate, 'YYYY-MM'), t.transactionType " +
           "ORDER BY month")
    List<Object[]> sumGroupedByMonthAndType(@Param("farmId") UUID farmId, @Param("from") OffsetDateTime from);

    // Budget initial spent — scoped query replaces loading all transactions
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM FinancialTransaction t " +
           "WHERE t.farm.id = :farmId AND t.deleted = false " +
           "AND t.transactionType = 'EXPENSE' AND UPPER(t.category) = UPPER(:category) " +
           "AND t.transactionDate >= :from AND t.transactionDate < :to")
    BigDecimal sumExpenseByCategoryAndDateRange(@Param("farmId") UUID farmId,
                                                @Param("category") String category,
                                                @Param("from") OffsetDateTime from,
                                                @Param("to") OffsetDateTime to);

    // Recent transactions for dashboard (limited to 10)
    List<FinancialTransaction> findTop10ByFarmIdAndDeletedFalseOrderByTransactionDateDesc(UUID farmId);

    // Recent transactions within a time window for bounded daily charts
    List<FinancialTransaction> findByFarmIdAndDeletedFalseAndTransactionDateGreaterThanEqualOrderByTransactionDateAsc(UUID farmId, OffsetDateTime from);
}
