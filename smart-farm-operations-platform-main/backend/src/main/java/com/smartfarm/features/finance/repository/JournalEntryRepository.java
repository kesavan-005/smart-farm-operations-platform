package com.smartfarm.features.finance.repository;

import com.smartfarm.features.finance.domain.JournalEntry;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {
    List<JournalEntry> findByFinancialTransactionId(UUID transactionId);

    @Query("SELECT j FROM JournalEntry j JOIN j.financialTransaction t WHERE t.farm.id = :farmId AND t.deleted = false ORDER BY j.createdAt DESC")
    List<JournalEntry> findByFarmId(@Param("farmId") UUID farmId);
}
