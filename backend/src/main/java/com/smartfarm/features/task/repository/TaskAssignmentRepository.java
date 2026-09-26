package com.smartfarm.features.task.repository;

import com.smartfarm.features.task.domain.TaskAssignment;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, UUID> {
    List<TaskAssignment> findByTaskId(UUID taskId);
}
