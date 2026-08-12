package com.smartfarm.features.crop.mapper;

import com.smartfarm.features.crop.domain.Crop;
import com.smartfarm.features.crop.dto.CropRequest;
import com.smartfarm.features.crop.dto.CropResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CropMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "field", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Crop toEntity(CropRequest request);

    @Mapping(target = "fieldId", source = "field.id")
    CropResponse toResponse(Crop entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "field", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(CropRequest request, @MappingTarget Crop entity);
}
