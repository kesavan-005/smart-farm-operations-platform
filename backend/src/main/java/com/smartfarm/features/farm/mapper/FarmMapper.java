package com.smartfarm.features.farm.mapper;

import com.smartfarm.common.dto.GeoJsonPolygon;
import com.smartfarm.common.util.GeometryUtils;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.dto.FarmRequest;
import com.smartfarm.features.farm.dto.FarmResponse;
import org.locationtech.jts.geom.Polygon;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface FarmMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "farmCode", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "boundary", source = "boundary", qualifiedByName = "toJtsPolygon")
    Farm toEntity(FarmRequest request);

    @Mapping(target = "ownerUserId", source = "owner.id")
    @Mapping(target = "boundary", source = "boundary", qualifiedByName = "toGeoJsonPolygon")
    FarmResponse toResponse(Farm entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "farmCode", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "boundary", source = "boundary", qualifiedByName = "toJtsPolygon")
    void updateEntity(FarmRequest request, @MappingTarget Farm entity);

    @Named("toJtsPolygon")
    default Polygon toJtsPolygon(GeoJsonPolygon geoJson) {
        return GeometryUtils.toJtsPolygon(geoJson);
    }

    @Named("toGeoJsonPolygon")
    default GeoJsonPolygon toGeoJsonPolygon(Polygon polygon) {
        return GeometryUtils.toGeoJsonPolygon(polygon);
    }
}
