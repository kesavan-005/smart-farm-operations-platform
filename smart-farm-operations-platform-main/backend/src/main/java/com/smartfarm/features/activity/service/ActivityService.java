package com.smartfarm.features.activity.service;

import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.activity.domain.Activity;
import com.smartfarm.features.activity.domain.ActivityPriority;
import com.smartfarm.features.activity.domain.ActivityStatus;
import com.smartfarm.features.activity.domain.ActivityType;
import com.smartfarm.features.activity.dto.ActivityRequest;
import com.smartfarm.features.activity.dto.ActivityResponse;
import com.smartfarm.features.activity.mapper.ActivityMapper;
import com.smartfarm.features.activity.repository.ActivityRepository;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.domain.UserFarmRole;
import com.smartfarm.features.auth.repository.UserFarmRoleRepository;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.crop.domain.Crop;
import com.smartfarm.features.crop.repository.CropRepository;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.field.domain.Field;
import com.smartfarm.features.field.repository.FieldRepository;
import java.time.OffsetDateTime;
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
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final FarmRepository farmRepository;
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final UserRepository userRepository;
    private final UserFarmRoleRepository userFarmRoleRepository;
    private final ActivityMapper activityMapper;
    private final com.smartfarm.features.task.repository.TaskRepository taskRepository;

    private Integer calculateActivityProgress(UUID activityId) {
        long totalTasks = taskRepository.countByActivityIdAndDeletedFalse(activityId);
        if (totalTasks == 0) {
            return 0;
        }
        long completedTasks = taskRepository.countByActivityIdAndStatusAndDeletedFalse(activityId, com.smartfarm.features.task.domain.TaskStatus.COMPLETED);
        return (int) Math.round(((double) completedTasks / totalTasks) * 100);
    }

    private ActivityResponse mapToResponseWithProgress(Activity activity) {
        ActivityResponse res = activityMapper.toResponse(activity);
        if (res != null) {
            res.setProgress(calculateActivityProgress(activity.getId()));
        }
        return res;
    }

    @Transactional
    public ActivityResponse createActivity(ActivityRequest request, UUID userId) {
        validateFarmWriteAccess(request.getFarmId(), userId);

        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));

        Field field = fieldRepository.findById(request.getFieldId())
                .orElseThrow(() -> new ResourceNotFoundException("Field not found"));

        if (!field.getFarm().getId().equals(farm.getId())) {
            throw new IllegalArgumentException("Field does not belong to the selected farm");
        }

        Crop crop = null;
        if (request.getCropId() != null) {
            crop = cropRepository.findById(request.getCropId())
                    .orElseThrow(() -> new ResourceNotFoundException("Crop not found"));
            if (!crop.getField().getId().equals(field.getId())) {
                throw new IllegalArgumentException("Crop does not belong to the selected field");
            }
        }

        User performedBy = null;
        if (request.getPerformedBy() != null) {
            performedBy = userRepository.findById(request.getPerformedBy())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found"));
            // Validate that performer has access to the farm
            validateUserFarmAccess(request.getFarmId(), performedBy.getId());
        }

        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Creator user not found"));

        User supervisor = null;
        if (request.getSupervisorId() != null) {
            supervisor = userRepository.findById(request.getSupervisorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supervisor user not found"));
        }

        Activity activity = activityMapper.toEntity(request);
        activity.setFarm(farm);
        activity.setField(field);
        activity.setCrop(crop);
        activity.setPerformedBy(performedBy);
        activity.setSupervisor(supervisor);
        activity.setCreatedBy(creator);

        if (activity.getStatus() == null) {
            activity.setStatus(ActivityStatus.PLANNED);
        }
        if (activity.getPriority() == null) {
            activity.setPriority(ActivityPriority.MEDIUM);
        }

        activity = activityRepository.save(activity);
        log.info("Created activity '{}' for farm: {}", activity.getTitle(), farm.getId());
        return mapToResponseWithProgress(activity);
    }

    @Transactional(readOnly = true)
    public ActivityResponse getActivityById(UUID id, UUID userId) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        validateFarmReadAccess(activity.getFarm().getId(), userId);

        // If worker, verify that they are assigned to this activity
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!"ADMIN".equalsIgnoreCase(user.getRole()) && !activity.getFarm().getOwner().getId().equals(userId)) {
            UserFarmRole farmRole = userFarmRoleRepository.findByUserId(userId).stream()
                    .filter(role -> role.getFarmId().equals(activity.getFarm().getId()))
                    .findFirst()
                    .orElseThrow(() -> new AccessDeniedException("Access denied to this farm"));

            if (farmRole.getRole() == Role.WORKER) {
                if (activity.getPerformedBy() == null || !activity.getPerformedBy().getId().equals(userId)) {
                    throw new AccessDeniedException("Workers can only access their assigned activities");
                }
            }
        }

        return mapToResponseWithProgress(activity);
    }

    @Transactional(readOnly = true)
    public Page<ActivityResponse> getActivities(
            UUID userId,
            UUID farmId,
            UUID fieldId,
            UUID cropId,
            ActivityType activityType,
            ActivityStatus status,
            ActivityPriority priority,
            OffsetDateTime startDate,
            OffsetDateTime endDate,
            UUID assignedUserId,
            String search,
            Pageable pageable) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        boolean isAdmin = "ADMIN".equalsIgnoreCase(user.getRole());

        Specification<Activity> spec = Specification.where(null);

        if (!isAdmin) {
            List<UserFarmRole> userRoles = userFarmRoleRepository.findByUserId(userId);
            spec = spec.and((root, query, cb) -> {
                // User is farm owner
                jakarta.persistence.criteria.Predicate isOwner = cb.equal(root.get("farm").get("owner").get("id"), userId);

                // Or has role on the farm
                if (!userRoles.isEmpty()) {
                    List<jakarta.persistence.criteria.Predicate> rolePredicates = userRoles.stream().map(role -> {
                        if (role.getRole() == Role.WORKER) {
                            return cb.and(
                                cb.equal(root.get("farm").get("id"), role.getFarmId()),
                                cb.equal(root.get("performedBy").get("id"), userId)
                            );
                        } else {
                            return cb.equal(root.get("farm").get("id"), role.getFarmId());
                        }
                    }).collect(Collectors.toList());

                    rolePredicates.add(isOwner);
                    return cb.or(rolePredicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
                } else {
                    return isOwner;
                }
            });
        }

        if (farmId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("farm").get("id"), farmId));
        }
        if (fieldId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("field").get("id"), fieldId));
        }
        if (cropId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("crop").get("id"), cropId));
        }
        if (activityType != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("activityType"), activityType));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (priority != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("priority"), priority));
        }
        if (startDate != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("scheduledDate"), startDate));
        }
        if (endDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("scheduledDate"), endDate));
        }
        if (assignedUserId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("performedBy").get("id"), assignedUserId));
        }
        if (search != null && !search.trim().isEmpty()) {
            String searchPattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), searchPattern),
                cb.like(cb.lower(root.get("description")), searchPattern),
                cb.like(cb.lower(root.get("notes")), searchPattern)
            ));
        }

        return activityRepository.findAll(spec, pageable).map(this::mapToResponseWithProgress);
    }

    @Transactional
    public ActivityResponse updateActivity(UUID id, ActivityRequest request, UUID userId) {
        Activity existing = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        validateFarmWriteAccess(existing.getFarm().getId(), userId);
        validateFarmWriteAccess(request.getFarmId(), userId);

        Farm farm = farmRepository.findById(request.getFarmId())
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));

        Field field = fieldRepository.findById(request.getFieldId())
                .orElseThrow(() -> new ResourceNotFoundException("Field not found"));

        if (!field.getFarm().getId().equals(farm.getId())) {
            throw new IllegalArgumentException("Field does not belong to the selected farm");
        }

        Crop crop = null;
        if (request.getCropId() != null) {
            crop = cropRepository.findById(request.getCropId())
                    .orElseThrow(() -> new ResourceNotFoundException("Crop not found"));
            if (!crop.getField().getId().equals(field.getId())) {
                throw new IllegalArgumentException("Crop does not belong to the selected field");
            }
        }

        User performedBy = null;
        if (request.getPerformedBy() != null) {
            performedBy = userRepository.findById(request.getPerformedBy())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found"));
            validateUserFarmAccess(request.getFarmId(), performedBy.getId());
        }

        User supervisor = null;
        if (request.getSupervisorId() != null) {
            supervisor = userRepository.findById(request.getSupervisorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supervisor user not found"));
        }

        User updater = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Updater user not found"));

        activityMapper.updateEntity(request, existing);
        existing.setFarm(farm);
        existing.setField(field);
        existing.setCrop(crop);
        existing.setPerformedBy(performedBy);
        existing.setSupervisor(supervisor);
        existing.setUpdatedBy(updater);

        existing = activityRepository.save(existing);
        log.info("Updated activity: {}", id);
        return mapToResponseWithProgress(existing);
    }

    @Transactional
    public void deleteActivity(UUID id, UUID userId) {
        Activity existing = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        validateFarmWriteAccess(existing.getFarm().getId(), userId);

        existing.setDeleted(true);
        existing.setDeletedAt(OffsetDateTime.now());
        activityRepository.save(existing);
        log.info("Soft deleted activity: {}", id);
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
}
