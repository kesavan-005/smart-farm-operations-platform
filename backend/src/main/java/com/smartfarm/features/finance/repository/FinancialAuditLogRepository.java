package com.smartfarm.features.finance.repository;

import com.smartfarm.features.finance.domain.FinancialAuditLog;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FinancialAuditLogRepository extends JpaRepository<FinancialAuditLog, UUID> {
    List<FinancialAuditLog> findByFinancialTransactionIdOrderByCreatedAtDesc(UUID transactionId);
}
