package com.smartfarm.features.auth.repository;

import com.smartfarm.features.auth.domain.UserFarmRole;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserFarmRoleRepository extends JpaRepository<UserFarmRole, UUID> {
    List<UserFarmRole> findByUserId(UUID userId);
}
