package com.smartfarm.features.auth.repository;

import com.smartfarm.features.auth.domain.OtpToken;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, UUID> {
    
    @Query("SELECT o FROM OtpToken o WHERE o.phone = :phone AND o.used = false AND o.expiresAt > CURRENT_TIMESTAMP ORDER BY o.createdAt DESC LIMIT 1")
    Optional<OtpToken> findValidOtpByPhone(String phone);
}
