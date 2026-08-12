package com.smartfarm.features.activity.mapper;

import com.smartfarm.features.activity.domain.Activity;
import com.smartfarm.features.activity.dto.ActivityRequest;
import com.smartfarm.features.activity.dto.ActivityResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ActivityMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "field", ignore = true)
    @Mapping(target = "crop", ignore = true)
    @Mapping(target = "performedBy", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "supervisor", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Activity toEntity(ActivityRequest request);

    @Mapping(target = "farmId", source = "farm.id")
    @Mapping(target = "farmCode", source = "farm.farmCode")
    @Mapping(target = "farmName", source = "farm.name")
    @Mapping(target = "fieldId", source = "field.id")
    @Mapping(target = "fieldCode", source = "field.fieldCode")
    @Mapping(target = "fieldName", source = "field.name")
    @Mapping(target = "cropId", source = "crop.id")
    @Mapping(target = "cropName", source = "crop.name")
    @Mapping(target = "performedBy", source = "performedBy.id")
    @Mapping(target = "performedByName", source = "performedBy.name")
    @Mapping(target = "performedByPhone", source = "performedBy.phone")
    @Mapping(target = "createdBy", source = "createdBy.id")
    @Mapping(target = "createdByName", source = "createdBy.name")
    @Mapping(target = "updatedBy", source = "updatedBy.id")
    @Mapping(target = "updatedByName", source = "updatedBy.name")
    @Mapping(target = "supervisorId", source = "supervisor.id")
    @Mapping(target = "supervisorName", source = "supervisor.name")
    @Mapping(target = "progress", ignore = true)
    ActivityResponse toResponse(Activity entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "field", ignore = true)
    @Mapping(target = "crop", ignore = true)
    @Mapping(target = "performedBy", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "supervisor", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(ActivityRequest request, @MappingTarget Activity entity);
}
