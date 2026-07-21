package com.smartfarm.features.field.mapper;

import com.smartfarm.common.dto.GeoJsonPolygon;
import com.smartfarm.common.util.GeometryUtils;
import com.smartfarm.features.field.domain.Field;
import com.smartfarm.features.field.dto.FieldRequest;
import com.smartfarm.features.field.dto.FieldResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;
import org.locationtech.jts.geom.Polygon;

@Mapper(componentModel = "spring")
public interface FieldMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "fieldCode", ignore = true)
    @Mapping(target = "boundary", source = "boundary", qualifiedByName = "toJtsPolygon")
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Field toEntity(FieldRequest request);

    @Mapping(target = "farmId", source = "farm.id")
    @Mapping(target = "boundary", source = "boundary", qualifiedByName = "toGeoJsonPolygon")
    FieldResponse toResponse(Field entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "fieldCode", ignore = true)
    @Mapping(target = "boundary", source = "boundary", qualifiedByName = "toJtsPolygon")
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(FieldRequest request, @MappingTarget Field entity);

    @Named("toJtsPolygon")
    default Polygon toJtsPolygon(GeoJsonPolygon geoJson) {
        return GeometryUtils.toJtsPolygon(geoJson);
    }

    @Named("toGeoJsonPolygon")
    default GeoJsonPolygon toGeoJsonPolygon(Polygon polygon) {
        return GeometryUtils.toGeoJsonPolygon(polygon);
    }
}
