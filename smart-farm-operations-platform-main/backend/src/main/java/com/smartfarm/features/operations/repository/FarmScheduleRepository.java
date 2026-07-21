package com.smartfarm.features.operations.repository;

import com.smartfarm.features.operations.domain.FarmSchedule;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmScheduleRepository extends JpaRepository<FarmSchedule, UUID>, JpaSpecificationExecutor<FarmSchedule> {
    List<FarmSchedule> findByFarmId(UUID farmId);
}
