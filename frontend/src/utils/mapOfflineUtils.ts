import * as turf from '@turf/turf';

/**
 * Math functions to calculate the slippy map tile X and Y from latitude/longitude.
 * https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
 */
function lng2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 -
      Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}

/**
 * Downloads map tiles for a specific GeoJSON polygon (farm boundary).
 * It will calculate the bounding box and fetch all required tiles for zoom levels 13 to 17.
 * Since we have `vite-plugin-pwa` configured to CacheFirst for `tile.openstreetmap.org`,
 * these `fetch` requests will be intercepted by the Service Worker and stored in the cache.
 */
export async function downloadFarmMapTiles(
  boundary: GeoJSON.Polygon,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    // 1. Get the bounding box [minLng, minLat, maxLng, maxLat]
    const bbox = turf.bbox(boundary);
    const minLng = bbox[0];
    const minLat = bbox[1];
    const maxLng = bbox[2];
    const maxLat = bbox[3];

    // Add a tiny buffer (roughly 500m) to ensure the edges aren't cut off
    // 0.005 degrees is roughly 500m
    const buffer = 0.005;
    const paddedMinLng = minLng - buffer;
    const paddedMinLat = minLat - buffer;
    const paddedMaxLng = maxLng + buffer;
    const paddedMaxLat = maxLat + buffer;

    // We only want reasonable zoom levels for offline farm use to prevent massive downloads.
    const zoomLevels = [13, 14, 15, 16, 17, 18];
    const tileUrls: string[] = [];

    // 2. Calculate the required tiles
    for (const zoom of zoomLevels) {
      const minX = lng2tile(paddedMinLng, zoom);
      const maxX = lng2tile(paddedMaxLng, zoom);
      
      // Note: Y coordinates go top-to-bottom, so maxLat corresponds to minY
      const minY = lat2tile(paddedMaxLat, zoom);
      const maxY = lat2tile(paddedMinLat, zoom);

      // Sanity check: limit total tiles to prevent abusing the OSM API
      // If the farm is gigantic, we cap the tiles to avoid ban.
      const tileCount = (maxX - minX + 1) * (maxY - minY + 1);
      if (tileCount > 500) {
        console.warn(`Too many tiles requested at zoom ${zoom} (${tileCount} tiles). Skipping to prevent rate limiting.`);
        continue;
      }

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          // Use the 'a' subdomain as standard, but workbox will cache it regardless
          tileUrls.push(`https://a.tile.openstreetmap.org/${zoom}/${x}/${y}.png`);
        }
      }
    }

    if (tileUrls.length === 0) {
      throw new Error("Farm area is too small or invalid to calculate map tiles.");
    }

    console.log(`Downloading ${tileUrls.length} map tiles for offline use...`);

    // 3. Fetch tiles sequentially or in small batches to not overwhelm browser/network
    const BATCH_SIZE = 10;
    let completed = 0;

    for (let i = 0; i < tileUrls.length; i += BATCH_SIZE) {
      const batch = tileUrls.slice(i, i + BATCH_SIZE);
      
      // Fetch batch concurrently
      await Promise.allSettled(
        batch.map((url) => 
          fetch(url, {
            // We use 'no-cors' for map tiles just to put them in the cache opaquely, 
            // but since they are standard images, normal fetch is usually fine.
            mode: 'cors',
            credentials: 'omit'
          }).catch((err) => console.warn('Failed to fetch tile:', url, err))
        )
      );

      completed += batch.length;
      if (onProgress) {
        // Report progress (0 to 100)
        onProgress(Math.min(100, Math.round((completed / tileUrls.length) * 100)));
      }
    }

    // Ensure it reports 100% at the end
    if (onProgress) onProgress(100);

  } catch (error) {
    console.error("Error downloading offline map tiles:", error);
    throw error;
  }
}
