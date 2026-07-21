package com.smartfarm.features.farm.mapper;

import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.dto.FarmRequest;
import com.smartfarm.features.farm.dto.FarmResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface FarmMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "farmCode", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Farm toEntity(FarmRequest request);

    @Mapping(target = "ownerUserId", source = "owner.id")
    FarmResponse toResponse(Farm entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "farmCode", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(FarmRequest request, @MappingTarget Farm entity);
}
