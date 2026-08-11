import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { MapContainer, TileLayer, Marker, Polygon as LeafletPolygon, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Edit3, Trash2, CheckCircle2, RotateCcw, AlertTriangle, CloudDownload } from 'lucide-react';
import { getCurrentLocation, calculateFarmArea, validateFarmBoundary, calculateCentroid } from '@/utils/geofenceUtils';
import { downloadFarmMapTiles } from '@/utils/mapOfflineUtils';

// Fix Leaflet default icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom marker icon for current location
const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom marker icon for centroid/center
const centerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Default center: Madurai, Tamil Nadu
const DEFAULT_CENTER: [number, number] = [9.9252, 78.1198];
const DEFAULT_ZOOM = 14;

export interface FarmBoundaryMapProps {
  boundary?: GeoJSON.Polygon | null;
  latitude?: number;
  longitude?: number;
  onBoundaryChange?: (boundary: GeoJSON.Polygon | null, centerLat?: number, centerLng?: number, areaSqMeters?: number) => void;
  readOnly?: boolean;
  isTamil?: boolean;
}

export interface FarmBoundaryMapRef {
  locateUser: () => Promise<void>;
  resetBoundary: () => void;
}

// Controller helper inside MapContainer to handle map panning
function MapViewSetter({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

// Click listener inside MapContainer for manual point creation
function MapClickListener({
  isDrawing,
  onAddPoint,
}: {
  isDrawing: boolean;
  onAddPoint: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onAddPoint(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export const FarmBoundaryMap = forwardRef<FarmBoundaryMapRef, FarmBoundaryMapProps>(function FarmBoundaryMap(
  { boundary, latitude, longitude, onBoundaryChange, readOnly = false, isTamil = false },
  ref
) {
  // State for polygon vertices in Leaflet format: [lat, lng][]
  const [points, setPoints] = useState<[number, number][]>(() => {
    if (boundary && boundary.coordinates && boundary.coordinates[0]) {
      // GeoJSON is [lng, lat], convert to Leaflet [lat, lng]
      return boundary.coordinates[0].slice(0, -1).map((pt) => [pt[1], pt[0]]);
    }
    return [];
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLoc, setCurrentLoc] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(() => {
    if (latitude && longitude) return [latitude, longitude];
    if (boundary && boundary.coordinates && boundary.coordinates[0] && boundary.coordinates[0].length > 0) {
      const centroid = calculateCentroid(boundary);
      if (centroid) return [centroid.latitude, centroid.longitude];
    }
    return DEFAULT_CENTER;
  });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isDownloadingMap, setIsDownloadingMap] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [mapDownloaded, setMapDownloaded] = useState(false);

  // Sync internal points when boundary prop updates externally
  useEffect(() => {
    if (boundary && boundary.coordinates && boundary.coordinates[0]) {
      const leafletPts: [number, number][] = boundary.coordinates[0].slice(0, -1).map((pt) => [pt[1], pt[0]]);
      setPoints(leafletPts);
      const centroid = calculateCentroid(boundary);
      if (centroid) {
        setMapCenter([centroid.latitude, centroid.longitude]);
      }
    } else if (!boundary) {
      setPoints([]);
    }
  }, [boundary]);

  // Emit boundary change upwards
  const emitChange = (newPoints: [number, number][]) => {
    setPoints(newPoints);
    if (!onBoundaryChange) return;

    if (newPoints.length < 3) {
      onBoundaryChange(null, undefined, undefined, 0);
      return;
    }

    // Convert Leaflet [lat, lng] -> GeoJSON [lng, lat]
    const geoJsonRing: [number, number][] = newPoints.map((pt) => [pt[1], pt[0]]);
    // Close polygon
    geoJsonRing.push([newPoints[0][1], newPoints[0][0]]);

    const geoJsonPolygon: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [geoJsonRing],
    };

    const areaRes = calculateFarmArea(geoJsonPolygon);
    const centroid = calculateCentroid(geoJsonPolygon);

    onBoundaryChange(
      geoJsonPolygon,
      centroid?.latitude,
      centroid?.longitude,
      areaRes.areaSqMeters
    );
  };

  const handleAddPoint = (lat: number, lng: number) => {
    const updated = [...points, [lat, lng] as [number, number]];
    emitChange(updated);
  };

  const handleRemoveLastPoint = () => {
    if (points.length === 0) return;
    const updated = points.slice(0, -1);
    emitChange(updated);
  };

  const handleClearBoundary = () => {
    emitChange([]);
    setIsDrawing(false);
  };

  const handleLocateUser = async () => {
    setLocationError(null);
    setIsLocating(true);
    try {
      const loc = await getCurrentLocation();
      const coords: [number, number] = [loc.latitude, loc.longitude];
      setCurrentLoc(coords);
      setMapCenter(coords);
    } catch (err: any) {
      setLocationError(err.message || 'Failed to fetch current location');
    } finally {
      setIsLocating(false);
    }
  };

  useImperativeHandle(ref, () => ({
    locateUser: handleLocateUser,
    resetBoundary: handleClearBoundary,
  }));

  const handleDownloadMap = async () => {
    if (!currentGeoJson) return;
    setIsDownloadingMap(true);
    setDownloadProgress(0);
    setMapDownloaded(false);
    
    try {
      await downloadFarmMapTiles(currentGeoJson, (progress) => {
        setDownloadProgress(progress);
      });
      setMapDownloaded(true);
    } catch (err) {
      console.error("Map download failed", err);
    } finally {
      setIsDownloadingMap(false);
    }
  };

  // Calculations for current polygon display
  const currentGeoJson: GeoJSON.Polygon | null =
    points.length >= 3
      ? {
          type: 'Polygon',
          coordinates: [[...points.map((pt) => [pt[1], pt[0]]), [points[0][1], points[0][0]]]],
        }
      : null;

  const areaInfo = calculateFarmArea(currentGeoJson);
  const boundaryValidation = validateFarmBoundary(currentGeoJson);
  const calculatedCentroid = calculateCentroid(currentGeoJson);

  return (
    <div className="space-y-3">
      {/* Controls Bar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/40 rounded-xl border border-border">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={isDrawing ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsDrawing(!isDrawing)}
              className="gap-1.5 h-8 text-xs font-medium"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isDrawing
                ? isTamil
                  ? 'வரைவதை நிறுத்து'
                  : 'Done Drawing'
                : isTamil
                ? 'எல்லை வரை'
                : 'Draw Farm Boundary'}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLocateUser}
              disabled={isLocating}
              className="gap-1.5 h-8 text-xs font-medium"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating
                ? isTamil
                  ? 'இருப்பிடம் பெறுகிறது...'
                  : 'Getting Location...'
                : isTamil
                ? 'என் இருப்பிடம்'
                : 'Use My Current Location'}
            </Button>

            {points.length > 0 && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLastPoint}
                  className="gap-1 h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isTamil ? 'கடைசி புள்ளியை நீக்கு' : 'Undo Point'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearBoundary}
                  className="gap-1 h-8 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isTamil ? 'அழி' : 'Clear Boundary'}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium">
            {boundaryValidation.valid ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isTamil ? 'எல்லை தேர்வு செய்யப்பட்டது' : 'Boundary Selected'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5" />
                {points.length > 0
                  ? isTamil
                    ? `மேலும் ${3 - points.length} புள்ளிகள் தேவை`
                    : `Add ${3 - points.length} more point(s)`
                  : isTamil
                  ? 'எல்லை வரையப்படவில்லை'
                  : 'No boundary drawn'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Geolocation Error Alert */}
      {locationError && (
        <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center justify-between">
          <span>{locationError}</span>
          <button type="button" onClick={() => setLocationError(null)} className="font-bold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Drawing Instructions Notice */}
      {isDrawing && (
        <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary font-medium flex items-center justify-between sf-animate-in">
          <span>
            {isTamil
              ? '💡 வரைபடத்தை தொட்டு பண்ணையின் மூலைகளை குறிக்கவும்.'
              : '💡 Click on the map to add polygon corners around your farm boundary.'}
          </span>
          <span className="text-[10px] opacity-80">({points.length} points placed)</span>
        </div>
      )}

      {/* Leaflet Map Frame */}
      <div className="relative w-full h-[360px] rounded-xl overflow-hidden border border-border shadow-sm z-0">
        <MapContainer
          center={mapCenter}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          className="w-full h-full"
          style={{ background: '#f8fafc' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewSetter center={mapCenter} />
          <MapClickListener isDrawing={isDrawing} onAddPoint={handleAddPoint} />

          {/* Current user location marker */}
          {currentLoc && <Marker position={currentLoc} icon={currentLocationIcon} />}

          {/* Calculated centroid marker */}
          {calculatedCentroid && (
            <Marker position={[calculatedCentroid.latitude, calculatedCentroid.longitude]} icon={centerIcon} />
          )}

          {/* Render polygon vertices markers when drawing */}
          {isDrawing &&
            points.map((pt, idx) => (
              <Marker key={idx} position={pt} />
            ))}

          {/* Drawn Polygon */}
          {points.length >= 3 && (
            <LeafletPolygon
              positions={points}
              pathOptions={{
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.35,
                weight: 3,
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Live Geospatial Metrics Footer */}
      {points.length >= 3 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 p-3 rounded-xl border border-border text-xs">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
              {isTamil ? 'மைய அட்சரேகை' : 'Center Latitude'}
            </span>
            <span className="font-mono font-medium text-foreground">
              {calculatedCentroid?.latitude.toFixed(6) ?? 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
              {isTamil ? 'மைய தீர்க்கரேகை' : 'Center Longitude'}
            </span>
            <span className="font-mono font-medium text-foreground">
              {calculatedCentroid?.longitude.toFixed(6) ?? 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
              {isTamil ? 'ஏக்கர்' : 'Farm Area (Acres)'}
            </span>
            <span className="font-semibold text-primary">
              {areaInfo.acres} acres ({areaInfo.hectares} ha)
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
              {isTamil ? 'சதுர மீட்டர்' : 'Canonical Area'}
            </span>
            <span className="font-mono text-foreground font-medium">
              {areaInfo.areaSqMeters.toLocaleString()} m²
            </span>
          </div>
        </div>
      )}

      {/* Offline Map Download */}
      {points.length >= 3 && currentGeoJson && (
        <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {isTamil ? 'ஆஃப்லைன் வரைபடம்' : 'Offline Map Access'}
            </span>
            <span className="text-xs text-muted-foreground">
              {isTamil 
                ? 'இணையம் இல்லாமல் பார்க்க பண்ணை வரைபடத்தை பதிவிறக்கவும்' 
                : 'Download farm map to view without internet connection'}
            </span>
          </div>
          <Button
            type="button"
            variant={mapDownloaded ? 'outline' : 'default'}
            size="sm"
            onClick={handleDownloadMap}
            disabled={isDownloadingMap || mapDownloaded}
            className="gap-2 h-9 text-xs"
          >
            {isDownloadingMap ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                {downloadProgress}%
              </>
            ) : mapDownloaded ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {isTamil ? 'பதிவிறக்கப்பட்டது' : 'Downloaded'}
              </>
            ) : (
              <>
                <CloudDownload className="w-3.5 h-3.5" />
                {isTamil ? 'பதிவிறக்கு' : 'Download'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
});
