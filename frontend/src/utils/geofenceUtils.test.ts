import { describe, it, expect } from 'vitest';
import {
  calculateFarmArea,
  validateFarmBoundary,
  checkPointInsideFarm,
  convertCoordinatesToGeoJSON,
  calculateCentroid,
} from './geofenceUtils';

describe('geofenceUtils', () => {
  const sampleCoords: [number, number][] = [
    [78.11, 9.92],
    [78.12, 9.92],
    [78.12, 9.93],
    [78.11, 9.93],
  ];

  const samplePolygon: GeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [
      [
        [78.11, 9.92],
        [78.12, 9.92],
        [78.12, 9.93],
        [78.11, 9.93],
        [78.11, 9.92],
      ],
    ],
  };

  it('converts coordinate array to closed GeoJSON Polygon', () => {
    const poly = convertCoordinatesToGeoJSON(sampleCoords);
    expect(poly).not.toBeNull();
    expect(poly?.type).toBe('Polygon');
    expect(poly?.coordinates[0].length).toBe(5);
    expect(poly?.coordinates[0][0]).toEqual(poly?.coordinates[0][4]);
  });

  it('validates a correct farm boundary polygon', () => {
    const result = validateFarmBoundary(samplePolygon);
    expect(result.valid).toBe(true);
  });

  it('invalidates a polygon with fewer than 3 unique points', () => {
    const invalidPoly: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [78.11, 9.92],
          [78.12, 9.92],
          [78.11, 9.92],
        ],
      ],
    };
    const result = validateFarmBoundary(invalidPoly);
    expect(result.valid).toBe(false);
  });

  it('calculates farm area in sq meters, acres, and hectares', () => {
    const area = calculateFarmArea(samplePolygon);
    expect(area.areaSqMeters).toBeGreaterThan(0);
    expect(area.acres).toBeGreaterThan(0);
    expect(area.hectares).toBeGreaterThan(0);
  });

  it('checks if a point is inside or outside the farm boundary', () => {
    const insidePoint = checkPointInsideFarm(9.925, 78.115, samplePolygon);
    expect(insidePoint.inside).toBe(true);

    const outsidePoint = checkPointInsideFarm(10.0, 79.0, samplePolygon);
    expect(outsidePoint.inside).toBe(false);
  });

  it('calculates geographic centroid correctly', () => {
    const centroid = calculateCentroid(samplePolygon);
    expect(centroid).not.toBeNull();
    expect(centroid?.latitude).toBeCloseTo(9.925, 2);
    expect(centroid?.longitude).toBeCloseTo(78.115, 2);
  });
});
