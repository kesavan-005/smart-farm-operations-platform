package com.smartfarm.features.auth.repository;

import com.smartfarm.features.auth.domain.FarmMemberSensitivePermission;
import com.smartfarm.features.auth.domain.SensitivePermission;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmMemberSensitivePermissionRepository extends JpaRepository<FarmMemberSensitivePermission, UUID> {
    List<FarmMemberSensitivePermission> findByMembershipId(UUID membershipId);
    boolean existsByMembershipIdAndPermission(UUID membershipId, SensitivePermission permission);
    void deleteByMembershipId(UUID membershipId);
}
