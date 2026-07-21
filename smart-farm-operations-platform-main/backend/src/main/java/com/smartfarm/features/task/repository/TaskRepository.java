package com.smartfarm.features.task.repository;

import com.smartfarm.features.task.domain.Task;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.smartfarm.features.task.domain.TaskStatus;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {
    long countByActivityIdAndDeletedFalse(UUID activityId);
    long countByActivityIdAndStatusAndDeletedFalse(UUID activityId, TaskStatus status);
    List<Task> findByActivityIdAndDeletedFalse(UUID activityId);
}
