package com.smartfarm.features.finance.domain;

import com.smartfarm.features.auth.domain.User;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "financial_audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialAuditLog {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "financial_transaction_id")
    private UUID financialTransactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 20)
    private String operation; // CREATE, UPDATE, DELETE

    @Column(name = "old_value")
    private String oldValue;

    @Column(name = "new_value")
    private String newValue;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
