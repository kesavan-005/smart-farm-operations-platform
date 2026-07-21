package com.smartfarm.common.util;

import com.smartfarm.common.dto.GeoJsonPolygon;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import java.util.ArrayList;
import java.util.List;

public class GeometryUtils {
    private static final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public static Polygon toJtsPolygon(GeoJsonPolygon geoJson) {
        if (geoJson == null || !"Polygon".equals(geoJson.getType())) {
            return null;
        }
        List<List<List<Double>>> coordinates = geoJson.getCoordinates();
        if (coordinates == null || coordinates.isEmpty()) {
            return null;
        }
        
        List<Coordinate> jtsCoords = new ArrayList<>();
        for (List<Double> pt : coordinates.get(0)) {
            jtsCoords.add(new Coordinate(pt.get(0), pt.get(1)));
        }
        
        Coordinate[] coordArray = jtsCoords.toArray(new Coordinate[0]);
        LinearRing shell = geometryFactory.createLinearRing(coordArray);
        return geometryFactory.createPolygon(shell, null);
    }

    public static GeoJsonPolygon toGeoJsonPolygon(Polygon polygon) {
        if (polygon == null) {
            return null;
        }
        List<List<Double>> exterior = new ArrayList<>();
        for (Coordinate coord : polygon.getExteriorRing().getCoordinates()) {
            exterior.add(List.of(coord.x, coord.y));
        }
        return GeoJsonPolygon.builder()
            .type("Polygon")
            .coordinates(List.of(exterior))
            .build();
    }
}
