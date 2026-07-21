package com.smartfarm.features.finance.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "journal_entries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntry {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "financial_transaction_id")
    private FinancialTransaction financialTransaction;

    @Column(name = "account_name", nullable = false, length = 100)
    private String accountName; // CASH, INVENTORY, REVENUE, FARM_EXPENSE, LIABILITY

    @Column(name = "entry_type", nullable = false, length = 10)
    private String entryType; // DEBIT, CREDIT

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
