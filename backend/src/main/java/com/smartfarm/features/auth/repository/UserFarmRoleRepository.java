package com.smartfarm.features.auth.repository;

import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.UserFarmRole;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserFarmRoleRepository extends JpaRepository<UserFarmRole, UUID> {
    List<UserFarmRole> findByUserId(UUID userId);
    List<UserFarmRole> findByUserIdAndActiveTrue(UUID userId);

    Optional<UserFarmRole> findByUserIdAndFarmId(UUID userId, UUID farmId);
    Optional<UserFarmRole> findByUserIdAndFarmIdAndActiveTrue(UUID userId, UUID farmId);

    List<UserFarmRole> findByFarmIdAndActiveTrue(UUID farmId);
    List<UserFarmRole> findByFarmId(UUID farmId);

    boolean existsByUserIdAndFarmIdAndActiveTrue(UUID userId, UUID farmId);
    boolean existsByUserIdAndFarmIdAndRoleAndActiveTrue(UUID userId, UUID farmId, Role role);
}
