package com.smartfarm.features.auth.repository;

import com.smartfarm.features.auth.domain.FarmMemberModuleAccess;
import com.smartfarm.features.auth.domain.FarmModule;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmMemberModuleAccessRepository extends JpaRepository<FarmMemberModuleAccess, UUID> {
    List<FarmMemberModuleAccess> findByMembershipId(UUID membershipId);
    Optional<FarmMemberModuleAccess> findByMembershipIdAndModule(UUID membershipId, FarmModule module);
    void deleteByMembershipId(UUID membershipId);
}
