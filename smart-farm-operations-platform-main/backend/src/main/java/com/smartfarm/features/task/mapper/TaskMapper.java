package com.smartfarm.features.task.mapper;

import com.smartfarm.features.task.domain.Task;
import com.smartfarm.features.task.dto.TaskRequest;
import com.smartfarm.features.task.dto.TaskResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TaskMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "activity", ignore = true)
    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "field", ignore = true)
    @Mapping(target = "assignedTo", ignore = true)
    @Mapping(target = "assignedBy", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "assignedEquipment", ignore = true)
    Task toEntity(TaskRequest request);

    @Mapping(target = "activityId", source = "activity.id")
    @Mapping(target = "activityTitle", source = "activity.title")
    @Mapping(target = "farmId", source = "farm.id")
    @Mapping(target = "farmName", source = "farm.name")
    @Mapping(target = "fieldId", source = "field.id")
    @Mapping(target = "fieldName", source = "field.name")
    @Mapping(target = "assignedTo", source = "assignedTo.id")
    @Mapping(target = "assignedToName", source = "assignedTo.name")
    @Mapping(target = "assignedToPhone", source = "assignedTo.phone")
    @Mapping(target = "assignedBy", source = "assignedBy.id")
    @Mapping(target = "assignedByName", source = "assignedBy.name")
    @Mapping(target = "createdBy", source = "createdBy.id")
    @Mapping(target = "createdByName", source = "createdBy.name")
    @Mapping(target = "updatedBy", source = "updatedBy.id")
    @Mapping(target = "updatedByName", source = "updatedBy.name")
    @Mapping(target = "assignedEquipmentId", source = "assignedEquipment.id")
    @Mapping(target = "assignedEquipmentName", source = "assignedEquipment.name")
    TaskResponse toResponse(Task entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "activity", ignore = true)
    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "field", ignore = true)
    @Mapping(target = "assignedTo", ignore = true)
    @Mapping(target = "assignedBy", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "assignedEquipment", ignore = true)
    void updateEntityFromRequest(TaskRequest request, @MappingTarget Task entity);
}
