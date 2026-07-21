package com.smartfarm.features.operations.repository;

import com.smartfarm.features.operations.domain.LaborRecord;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LaborRecordRepository extends JpaRepository<LaborRecord, UUID>, JpaSpecificationExecutor<LaborRecord> {
    List<LaborRecord> findByFarmId(UUID farmId);
    Optional<LaborRecord> findByWorkerIdAndRecordDate(UUID workerId, LocalDate recordDate);
}
