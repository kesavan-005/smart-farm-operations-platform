package com.smartfarm.common.util;

import com.smartfarm.common.dto.GeoJsonPolygon;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Point;
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
            if (pt == null || pt.size() < 2) continue;
            jtsCoords.add(new Coordinate(pt.get(0), pt.get(1)));
        }

        if (jtsCoords.size() < 4) {
            return null;
        }

        // Ensure closed ring
        Coordinate first = jtsCoords.get(0);
        Coordinate last = jtsCoords.get(jtsCoords.size() - 1);
        if (first.x != last.x || first.y != last.y) {
            jtsCoords.add(new Coordinate(first.x, first.y));
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

    public static boolean isPointInside(Polygon polygon, double latitude, double longitude) {
        if (polygon == null) {
            return false;
        }
        // GeoJSON / JTS coordinate is (x=longitude, y=latitude)
        Point point = geometryFactory.createPoint(new Coordinate(longitude, latitude));
        return polygon.covers(point) || polygon.contains(point);
    }

    public static double[] getCentroid(Polygon polygon) {
        if (polygon == null) {
            return null;
        }
        Point centroid = polygon.getCentroid();
        // Returns [latitude, longitude]
        return new double[]{centroid.getY(), centroid.getX()};
    }
}
