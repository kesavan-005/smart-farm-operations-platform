import * as turf from '@turf/turf';

export interface LocationResult {
  latitude: number;
  longitude: number;
}

export interface FarmAreaResult {
  areaSqMeters: number;
  acres: number;
  hectares: number;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Promisified browser geolocation fetcher with explicit error messages.
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission was denied. Please enable location services in your browser.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('GPS location is currently unavailable. Check your device location settings.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'));
            break;
          default:
            reject(new Error('Failed to retrieve current location.'));
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Calculates farm area in square meters, acres, and hectares using Turf.js
 */
export function calculateFarmArea(boundary: GeoJSON.Polygon | null | undefined): FarmAreaResult {
  if (!boundary || !boundary.coordinates || !boundary.coordinates[0] || boundary.coordinates[0].length < 4) {
    return { areaSqMeters: 0, acres: 0, hectares: 0 };
  }

  try {
    const sqMeters = turf.area(boundary);
    const acres = sqMeters / 4046.8564224;
    const hectares = sqMeters / 10000;

    return {
      areaSqMeters: Math.round(sqMeters * 100) / 100,
      acres: Math.round(acres * 100) / 100,
      hectares: Math.round(hectares * 100) / 100,
    };
  } catch (err) {
    console.error('Error calculating farm area:', err);
    return { areaSqMeters: 0, acres: 0, hectares: 0 };
  }
}

/**
 * Validates GeoJSON Polygon structure according to spatial rules.
 */
export function validateFarmBoundary(boundary: GeoJSON.Polygon | null | undefined): ValidationResult {
  if (!boundary) {
    return { valid: false, message: 'Please draw your farm boundary on the map before saving.' };
  }

  if (boundary.type !== 'Polygon') {
    return { valid: false, message: 'Boundary geometry must be a Polygon.' };
  }

  const ring = boundary.coordinates?.[0];
  if (!ring || !Array.isArray(ring)) {
    return { valid: false, message: 'Boundary polygon must contain coordinate positions.' };
  }

  if (ring.length < 4) {
    return { valid: false, message: 'Farm boundary polygon must contain at least 3 distinct vertices.' };
  }

  // Verify lat/lng ranges
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2 || isNaN(pt[0]) || isNaN(pt[1])) {
      return { valid: false, message: 'Boundary contains invalid coordinate points.' };
    }
    const [lng, lat] = pt;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { valid: false, message: 'Coordinate points are outside valid geographic latitude/longitude range.' };
    }
  }

  // Ensure ring is closed
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return { valid: false, message: 'Farm boundary polygon must be a closed loop.' };
  }

  return { valid: true };
}

/**
 * Checks whether a given (latitude, longitude) coordinate falls inside a farm boundary.
 */
export function checkPointInsideFarm(
  latitude: number,
  longitude: number,
  boundary: GeoJSON.Polygon | null | undefined
): { inside: boolean } {
  const validation = validateFarmBoundary(boundary);
  if (!validation.valid || !boundary) {
    return { inside: false };
  }

  try {
    const pt = turf.point([longitude, latitude]);
    const inside = turf.booleanPointInPolygon(pt, boundary);
    return { inside };
  } catch (err) {
    console.error('Error testing point in polygon:', err);
    return { inside: false };
  }
}

/**
 * Converts a list of [lng, lat] coordinate pairs into a valid, closed GeoJSON Polygon.
 */
export function convertCoordinatesToGeoJSON(coords: [number, number][]): GeoJSON.Polygon | null {
  if (!coords || coords.length < 3) {
    return null;
  }

  const ring: [number, number][] = coords.map((c) => [c[0], c[1]]);
  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }

  return {
    type: 'Polygon',
    coordinates: [ring],
  };
}

/**
 * Calculates geographic centroid [latitude, longitude] of a farm boundary.
 */
export function calculateCentroid(boundary: GeoJSON.Polygon | null | undefined): LocationResult | null {
  if (!boundary || !validateFarmBoundary(boundary).valid) {
    return null;
  }

  try {
    const centroidFeature = turf.centroid(boundary);
    const [lng, lat] = centroidFeature.geometry.coordinates;
    return { latitude: lat, longitude: lng };
  } catch (err) {
    console.error('Error computing boundary centroid:', err);
    return null;
  }
}
