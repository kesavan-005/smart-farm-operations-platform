package com.smartfarm.features.task.service;

import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.activity.domain.Activity;
import com.smartfarm.features.activity.repository.ActivityRepository;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.domain.UserFarmRole;
import com.smartfarm.features.auth.repository.UserFarmRoleRepository;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.field.domain.Field;
import com.smartfarm.features.field.repository.FieldRepository;
import com.smartfarm.features.task.domain.*;
import com.smartfarm.features.task.dto.TaskRequest;
import com.smartfarm.features.task.dto.TaskResponse;
import com.smartfarm.features.task.mapper.TaskMapper;
import com.smartfarm.features.task.repository.*;
import com.smartfarm.features.operations.repository.EquipmentRepository;
import com.smartfarm.features.inventory.service.InventoryService;
import com.smartfarm.features.finance.service.FinanceService;
import com.smartfarm.features.inventory.dto.StockTransactionRequest;
import com.smartfarm.features.finance.dto.FinancialTransactionRequest;
import jakarta.persistence.criteria.Predicate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ActivityRepository activityRepository;
    private final FarmRepository farmRepository;
    private final FieldRepository fieldRepository;
    private final UserRepository userRepository;
    private final UserFarmRoleRepository userFarmRoleRepository;
    private final TaskMapper taskMapper;
    private final EquipmentRepository equipmentRepository;
    private final InventoryService inventoryService;
    private final FinanceService financeService;
    private final TaskHistoryRepository taskHistoryRepository;
    private final TaskChecklistRepository taskChecklistRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final TaskAttachmentRepository taskAttachmentRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;

    @Transactional
    public TaskResponse createTask(TaskRequest request, UUID userId) {
        validateFarmWriteAccess(request.getFarmId(), userId);

        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));

        Field field = fieldRepository.findById(request.getFieldId())
                .orElseThrow(() -> new ResourceNotFoundException("Field not found"));

        if (!field.getFarm().getId().equals(farm.getId())) {
            throw new IllegalArgumentException("Field does not belong to the selected farm");
        }

        Activity activity = activityRepository.findById(request.getActivityId())
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        if (!activity.getFarm().getId().equals(farm.getId())) {
            throw new IllegalArgumentException("Activity does not belong to the selected farm");
        }

        User assignedTo = null;
        if (request.getAssignedTo() != null) {
            assignedTo = userRepository.findById(request.getAssignedTo())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found"));
            validateUserFarmAccess(request.getFarmId(), assignedTo.getId());
        }

        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Creator user not found"));

        Task task = taskMapper.toEntity(request);
        task.setFarm(farm);
        task.setField(field);
        task.setActivity(activity);
        task.setAssignedTo(assignedTo);
        task.setAssignedBy(creator);
        task.setCreatedBy(creator);

        if (request.getAssignedEquipmentId() != null) {
            task.setAssignedEquipment(equipmentRepository.findById(request.getAssignedEquipmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Equipment not found")));
        }
        task.setInventoryItemId(request.getInventoryItemId());
        task.setInventoryQuantityUsed(request.getInventoryQuantityUsed());
        task.setActualCost(request.getActualCost());

        if (task.getStatus() == null) {
            task.setStatus(TaskStatus.TODO);
        }
        if (task.getPriority() == null) {
            task.setPriority(TaskPriority.MEDIUM);
        }

        task = taskRepository.save(task);

        // Record history log
        recordTaskHistory(task, creator, null, task.getStatus(), "Task created and initialized");

        // Notification Hook: Prepare architectural logs for Task Assigned
        if (assignedTo != null) {
            log.info("[NOTIFICATION] Worker: New Task Assigned: '{}' for Activity: '{}'", task.getTitle(), activity.getTitle());
        }

        log.info("Created task '{}' for activity: {}", task.getTitle(), activity.getId());
        return taskMapper.toResponse(task);
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(UUID id, UUID userId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        validateFarmReadAccess(task.getFarm().getId(), userId);

        // Worker validation: Workers can only view tasks assigned to them
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            boolean isOwner = task.getFarm().getOwner().getId().equals(userId);
            if (!isOwner) {
                UserFarmRole farmRole = userFarmRoleRepository.findByUserId(userId).stream()
                        .filter(role -> role.getFarmId().equals(task.getFarm().getId()))
                        .findFirst()
                        .orElseThrow(() -> new AccessDeniedException("Access denied to this farm"));

                if (farmRole.getRole() == Role.WORKER) {
                    if (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(userId)) {
                        throw new AccessDeniedException("Workers are only allowed to view tasks assigned to them");
                    }
                }
            }
        }

        return taskMapper.toResponse(task);
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> getAllTasks(UUID farmId, UUID fieldId, UUID activityId, UUID assignedUserId,
                                        TaskStatus status, TaskPriority priority, String search,
                                        Pageable pageable, UUID userId) {
        Specification<Task> spec = Specification.where(null);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            List<UserFarmRole> userRoles = userFarmRoleRepository.findByUserId(userId);
            List<UUID> accessibleFarmIds = userRoles.stream()
                    .map(UserFarmRole::getFarmId)
                    .collect(Collectors.toCollection(ArrayList::new));

            List<Farm> ownedFarms = farmRepository.findAll((root, query, cb) -> cb.equal(root.get("owner").get("id"), userId));
            ownedFarms.forEach(f -> {
                if (!accessibleFarmIds.contains(f.getId())) {
                    accessibleFarmIds.add(f.getId());
                }
            });

            if (accessibleFarmIds.isEmpty()) {
                return Page.empty(pageable);
            }

            // Apply farm filter
            if (farmId != null) {
                if (!accessibleFarmIds.contains(farmId)) {
                    throw new AccessDeniedException("Access denied to requested farm");
                }
                spec = spec.and((root, query, cb) -> cb.equal(root.get("farm").get("id"), farmId));
            } else {
                spec = spec.and((root, query, cb) -> root.get("farm").get("id").in(accessibleFarmIds));
            }

            // Role-based visibility logic: Workers only see assigned tasks
            spec = spec.and((root, query, cb) -> {
                List<Predicate> farmPredicates = new ArrayList<>();
                for (UUID fid : accessibleFarmIds) {
                    Farm farm = farmRepository.findById(fid).orElse(null);
                    boolean isFarmOwner = farm != null && farm.getOwner().getId().equals(userId);

                    if (isFarmOwner) {
                        farmPredicates.add(cb.equal(root.get("farm").get("id"), fid));
                    } else {
                        UserFarmRole farmRole = userFarmRoleRepository.findByUserId(userId).stream()
                                .filter(r -> r.getFarmId().equals(fid))
                                .findFirst()
                                .orElse(null);

                        if (farmRole != null && farmRole.getRole() == Role.WORKER) {
                            farmPredicates.add(cb.and(
                                cb.equal(root.get("farm").get("id"), fid),
                                cb.equal(root.get("assignedTo").get("id"), userId)
                            ));
                        } else {
                            farmPredicates.add(cb.equal(root.get("farm").get("id"), fid));
                        }
                    }
                }
                return cb.or(farmPredicates.toArray(new Predicate[0]));
            });
        } else {
            // Admin context farm filter
            if (farmId != null) {
                spec = spec.and((root, query, cb) -> cb.equal(root.get("farm").get("id"), farmId));
            }
        }

        // Additional criteria filters
        if (fieldId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("field").get("id"), fieldId));
        }
        if (activityId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("activity").get("id"), activityId));
        }
        if (assignedUserId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("assignedTo").get("id"), assignedUserId));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (priority != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("priority"), priority));
        }
        if (search != null && !search.trim().isEmpty()) {
            String searchPattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), searchPattern),
                cb.like(cb.lower(root.get("description")), searchPattern),
                cb.like(cb.lower(root.get("remarks")), searchPattern)
            ));
        }

        return taskRepository.findAll(spec, pageable).map(taskMapper::toResponse);
    }

    @Transactional
    public TaskResponse updateTask(UUID id, TaskRequest request, UUID userId) {
        Task existing = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        final TaskStatus oldStatus = existing.getStatus();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isAdmin = "ADMIN".equalsIgnoreCase(user.getRole());
        boolean isOwner = existing.getFarm().getOwner().getId().equals(userId);
        
        final UUID farmId = existing.getFarm().getId();
        UserFarmRole farmRole = null;
        if (!isAdmin && !isOwner) {
            farmRole = userFarmRoleRepository.findByUserId(userId).stream()
                    .filter(role -> role.getFarmId().equals(farmId))
                    .findFirst()
                    .orElseThrow(() -> new AccessDeniedException("Access denied to this farm"));
        }

        // Check if the user is a worker
        boolean isWorker = farmRole != null && farmRole.getRole() == Role.WORKER;

        if (isWorker) {
            // Workers can only update status, actualHours, and remarks on tasks assigned to them
            if (existing.getAssignedTo() == null || !existing.getAssignedTo().getId().equals(userId)) {
                throw new AccessDeniedException("Workers can only update tasks assigned directly to them");
            }

            // Verify they didn't try to change administrative fields
            if (!existing.getTitle().equals(request.getTitle()) ||
                !existing.getActivity().getId().equals(request.getActivityId()) ||
                !existing.getFarm().getId().equals(request.getFarmId()) ||
                !existing.getField().getId().equals(request.getFieldId()) ||
                (existing.getAssignedTo() != null && !existing.getAssignedTo().getId().equals(request.getAssignedTo())) ||
                !existing.getDueDate().isEqual(request.getDueDate())) {
                throw new AccessDeniedException("Workers are only allowed to update status, actual hours, and remarks of their assigned tasks");
            }

            existing.setStatus(request.getStatus());
            existing.setActualHours(request.getActualHours());
            existing.setRemarks(request.getRemarks());
            existing.setInventoryItemId(request.getInventoryItemId());
            existing.setInventoryQuantityUsed(request.getInventoryQuantityUsed());
            existing.setActualCost(request.getActualCost());

            if (request.getStatus() == TaskStatus.COMPLETED && oldStatus != TaskStatus.COMPLETED) {
                existing.setCompletedDate(OffsetDateTime.now());
                log.info("[NOTIFICATION] Supervisor: Task Completed: '{}' for Activity: '{}' (Supervisor: '{}')", existing.getTitle(), existing.getActivity().getTitle(), existing.getActivity().getSupervisor() != null ? existing.getActivity().getSupervisor().getName() : "None");
            } else if (request.getStatus() != TaskStatus.COMPLETED) {
                existing.setCompletedDate(null);
            }
        } else {
            // Admin/Owner/Manager has full edit access
            validateFarmWriteAccess(request.getFarmId(), userId);

            Farm farm = farmRepository.findById(request.getFarmId())
                    .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));

            Field field = fieldRepository.findById(request.getFieldId())
                    .orElseThrow(() -> new ResourceNotFoundException("Field not found"));

            if (!field.getFarm().getId().equals(farm.getId())) {
                throw new IllegalArgumentException("Field does not belong to the selected farm");
            }

            Activity activity = activityRepository.findById(request.getActivityId())
                    .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

            if (!activity.getFarm().getId().equals(farm.getId())) {
                throw new IllegalArgumentException("Activity does not belong to the selected farm");
            }

            User assignedTo = null;
            if (request.getAssignedTo() != null) {
                assignedTo = userRepository.findById(request.getAssignedTo())
                        .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found"));
                validateUserFarmAccess(request.getFarmId(), assignedTo.getId());
            }

            taskMapper.updateEntityFromRequest(request, existing);
            existing.setFarm(farm);
            existing.setField(field);
            existing.setActivity(activity);
            existing.setAssignedTo(assignedTo);

            if (request.getAssignedEquipmentId() != null) {
                existing.setAssignedEquipment(equipmentRepository.findById(request.getAssignedEquipmentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Equipment not found")));
            } else {
                existing.setAssignedEquipment(null);
            }
            existing.setInventoryItemId(request.getInventoryItemId());
            existing.setInventoryQuantityUsed(request.getInventoryQuantityUsed());
            existing.setActualCost(request.getActualCost());

            if (request.getStatus() == TaskStatus.COMPLETED && oldStatus != TaskStatus.COMPLETED) {
                existing.setCompletedDate(OffsetDateTime.now());
                log.info("[NOTIFICATION] Supervisor: Task Completed: '{}' for Activity: '{}' (Supervisor: '{}')", existing.getTitle(), existing.getActivity().getTitle(), existing.getActivity().getSupervisor() != null ? existing.getActivity().getSupervisor().getName() : "None");
            } else if (request.getStatus() == TaskStatus.CANCELLED && oldStatus != TaskStatus.CANCELLED) {
                log.info("[NOTIFICATION] Admin: Task Cancelled: '{}' under Activity: '{}'", existing.getTitle(), existing.getActivity().getTitle());
            }
        }

        // Trigger integrations when task transitions to COMPLETED state
        if (existing.getStatus() == TaskStatus.COMPLETED && (existing.getCompletedDate() == null || existing.getCompletedDate().isAfter(OffsetDateTime.now().minusSeconds(10)))) {
            // 1. Inventory stock auto-deduction
            if (existing.getInventoryItemId() != null && existing.getInventoryQuantityUsed() != null && existing.getInventoryQuantityUsed().compareTo(java.math.BigDecimal.ZERO) > 0) {
                try {
                    StockTransactionRequest stockReq = new StockTransactionRequest();
                    stockReq.setQuantity(existing.getInventoryQuantityUsed());
                    stockReq.setTransactionType("USAGE");
                    stockReq.setUnit("KG");
                    stockReq.setReference("TASK:" + existing.getId());
                    stockReq.setNotes("Deducted automatically upon completion of task: " + existing.getTitle());
                    inventoryService.createTransaction(existing.getInventoryItemId(), existing.getFarm().getId(), userId, stockReq);
                    log.info("Auto-deducted inventory for completed task: '{}'", existing.getTitle());
                } catch (Exception e) {
                    log.error("Failed to automatically deduct inventory for completed task: {}", existing.getId(), e);
                }
            }

            // 2. Finance expense transaction auto-ledger entry
            if (existing.getActualCost() != null && existing.getActualCost().compareTo(java.math.BigDecimal.ZERO) > 0) {
                try {
                    FinancialTransactionRequest finReq = new FinancialTransactionRequest();
                    finReq.setTransactionType("EXPENSE");
                    finReq.setCategory("OPERATIONAL");
                    finReq.setAmount(existing.getActualCost());
                    finReq.setDescription("Auto-logged expense for completed task: " + existing.getTitle());
                    finReq.setReferenceId(existing.getId());
                    finReq.setReferenceType("TASK");
                    finReq.setPaymentMethod("CASH");
                    finReq.setStatus("COMPLETED");
                    finReq.setTransactionDate(OffsetDateTime.now());
                    financeService.recordTransaction(existing.getFarm().getId(), userId, finReq, "127.0.0.1");
                    log.info("Auto-logged finance transaction ledger entry for completed task: '{}'", existing.getTitle());
                } catch (Exception e) {
                    log.error("Failed to automatically log finance transaction ledger entry for completed task: {}", existing.getId(), e);
                }
            }
        }

        existing = taskRepository.save(existing);
        log.info("Updated task: {}", id);

        // Record history log if status changed
        if (oldStatus != existing.getStatus()) {
            recordTaskHistory(existing, user, oldStatus, existing.getStatus(), request.getRemarks());
        }

        // Notification Hook: Admin - Overdue Task
        if (existing.getDueDate() != null && existing.getDueDate().isBefore(OffsetDateTime.now()) && existing.getStatus() != TaskStatus.COMPLETED) {
            log.info("[NOTIFICATION] Admin: Overdue Task: '{}' has passed its due date", existing.getTitle());
        }

        return taskMapper.toResponse(existing);
    }

    @Transactional
    public void deleteTask(UUID id, UUID userId) {
        Task existing = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        validateFarmWriteAccess(existing.getFarm().getId(), userId);

        existing.setDeleted(true);
        existing.setDeletedAt(OffsetDateTime.now());
        taskRepository.save(existing);
        log.info("Soft deleted task: {}", id);
    }

    private void validateFarmReadAccess(UUID farmId, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            return;
        }

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        if (farm.getOwner().getId().equals(userId)) {
            return;
        }

        boolean hasAccess = userFarmRoleRepository.findByUserId(userId).stream()
                .anyMatch(role -> role.getFarmId().equals(farmId));
        if (!hasAccess) {
            throw new AccessDeniedException("Access denied to this farm");
        }
    }

    private void validateFarmWriteAccess(UUID farmId, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            return;
        }

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        if (farm.getOwner().getId().equals(userId)) {
            return;
        }

        UserFarmRole farmRole = userFarmRoleRepository.findByUserId(userId).stream()
                .filter(role -> role.getFarmId().equals(farmId))
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException("Access denied to this farm"));

        if (farmRole.getRole() == Role.WORKER || farmRole.getRole() == Role.VIEWER) {
            throw new AccessDeniedException("Access denied: insufficient write permissions for this farm");
        }
    }

    private void validateUserFarmAccess(UUID farmId, UUID userId) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        if (farm.getOwner().getId().equals(userId)) {
            return;
        }

        boolean hasAccess = userFarmRoleRepository.findByUserId(userId).stream()
                .anyMatch(role -> role.getFarmId().equals(farmId));
        if (!hasAccess) {
            throw new IllegalArgumentException("Assigned user does not have role access to this farm");
        }
    }

    public void recordTaskHistory(Task task, User user, TaskStatus oldStatus, TaskStatus newStatus, String remarks) {
        TaskHistory history = TaskHistory.builder()
                .task(task)
                .changedBy(user)
                .changedByName(user != null ? user.getName() : "System")
                .previousStatus(oldStatus != null ? oldStatus.name() : null)
                .newStatus(newStatus != null ? newStatus.name() : null)
                .remarks(remarks)
                .build();
        taskHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public List<TaskComment> getComments(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        validateFarmReadAccess(task.getFarm().getId(), userId);
        return taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(taskId);
    }

    @Transactional
    public TaskComment addComment(UUID taskId, String commentText, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        validateFarmReadAccess(task.getFarm().getId(), userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        TaskComment comment = TaskComment.builder()
                .task(task)
                .commenter(user)
                .commenterName(user.getName())
                .commentText(commentText)
                .build();

        return taskCommentRepository.save(comment);
    }

    @Transactional(readOnly = true)
    public List<TaskChecklist> getChecklist(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        validateFarmReadAccess(task.getFarm().getId(), userId);
        return taskChecklistRepository.findByTaskId(taskId);
    }

    @Transactional
    public TaskChecklist addChecklistItem(UUID taskId, String itemName, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        validateFarmReadAccess(task.getFarm().getId(), userId);

        TaskChecklist item = TaskChecklist.builder()
                .task(task)
                .itemName(itemName)
                .checked(false)
                .build();

        return taskChecklistRepository.save(item);
    }

    @Transactional
    public TaskChecklist toggleChecklistItem(UUID taskId, UUID itemId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        validateFarmReadAccess(task.getFarm().getId(), userId);

        TaskChecklist item = taskChecklistRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found"));

        if (!item.getTask().getId().equals(taskId)) {
            throw new IllegalArgumentException("Item does not belong to this task");
        }

        item.setChecked(!item.isChecked());
        return taskChecklistRepository.save(item);
    }

    @Transactional
    public void deleteChecklistItem(UUID taskId, UUID itemId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        validateFarmReadAccess(task.getFarm().getId(), userId);

        TaskChecklist item = taskChecklistRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist item not found"));

        if (!item.getTask().getId().equals(taskId)) {
            throw new IllegalArgumentException("Item does not belong to this task");
        }

        taskChecklistRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public List<TaskAttachment> getAttachments(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        validateFarmReadAccess(task.getFarm().getId(), userId);
        return taskAttachmentRepository.findByTaskId(taskId);
    }

    @Transactional
    public TaskAttachment addAttachment(UUID taskId, String url, String fileName, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        validateFarmReadAccess(task.getFarm().getId(), userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        TaskAttachment attachment = TaskAttachment.builder()
                .task(task)
                .url(url)
                .fileName(fileName)
                .uploadedBy(user)
                .build();

        return taskAttachmentRepository.save(attachment);
    }

    @Transactional(readOnly = true)
    public List<TaskHistory> getHistory(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        validateFarmReadAccess(task.getFarm().getId(), userId);
        return taskHistoryRepository.findByTaskIdOrderByCreatedAtDesc(taskId);
    }
}
