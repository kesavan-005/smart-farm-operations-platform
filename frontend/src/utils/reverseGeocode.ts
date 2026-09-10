/**
 * reverseGeocode.ts
 *
 * Standalone reverse-geocoding utility using Nominatim (OpenStreetMap).
 * Free, open, no API key required. Respects offline-first: callers catch
 * errors and show manual-entry fallback.
 *
 * Tamil Nadu administrative hierarchy mapping:
 *   village  <- village | hamlet | suburb | neighbourhood | town | city_district
 *   taluk    <- county | state_district
 *   district <- state_district | county
 *   state    <- state
 *   pincode  <- postcode
 *
 * Rate limit: 1 req/s (Nominatim policy).
 * The app makes at most 1 call per explicit user action (GPS or pin-drop).
 */

export interface ReverseGeocodeResult {
  /** Smallest settlement - village, hamlet, suburb, or town */
  village: string;
  /** Sub-district / Taluk level */
  taluk: string;
  /** Revenue district */
  district: string;
  /** State / Province */
  state: string;
  /** Postal code */
  pincode: string;
  /** Full human-readable address from Nominatim */
  displayName: string;
}

/** Raw Nominatim address object (partial — only fields we use) */
interface NominatimAddress {
  village?: string;
  hamlet?: string;
  suburb?: string;
  neighbourhood?: string;
  town?: string;
  city?: string;
  city_district?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface NominatimResponse {
  display_name: string;
  address: NominatimAddress;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'SmartFarmPlatform/2.0 (farm-management-app)';

/**
 * Reverse-geocode a (latitude, longitude) pair.
 *
 * @throws Error when the network is unavailable or Nominatim returns an error.
 *         The caller should catch this and show a manual-entry fallback.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  const url = new URL(NOMINATIM_BASE);
  url.searchParams.set('lat', latitude.toString());
  url.searchParams.set('lon', longitude.toString());
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'en');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.status}`);
  }

  const data: NominatimResponse = await response.json();
  const addr = data.address ?? {};

  // Village: most granular settlement name available
  const village =
    addr.village ??
    addr.hamlet ??
    addr.suburb ??
    addr.neighbourhood ??
    addr.city_district ??
    addr.town ??
    '';

  // Taluk: sub-district level (Tamil Nadu uses "county" or "state_district")
  const taluk = addr.county ?? addr.state_district ?? '';

  // District: revenue district level
  const district = addr.state_district ?? addr.county ?? '';

  const state = addr.state ?? '';
  const pincode = addr.postcode ?? '';

  return {
    village,
    taluk,
    district,
    state,
    pincode,
    displayName: data.display_name ?? '',
  };
}

