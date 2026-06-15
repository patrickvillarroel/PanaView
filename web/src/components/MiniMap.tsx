import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Vite strips webpack's require() from Leaflet's Icon.Default prototype,
// so we must delete _getIconUrl and supply explicit CDN URLs.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PANAMA: [number, number] = [8.9936, -79.5197];

export interface MapMarker {
  lat: number;
  lng: number;
}

interface Props {
  markers: MapMarker[];
  height?: number;
  /** Zoom level used when there is exactly one marker (default 14). */
  singleZoom?: number;
}

/** Adjusts the map view whenever the markers change. */
function AutoFit({ markers, singleZoom = 14 }: { markers: MapMarker[]; singleZoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], singleZoom, { animate: false });
    } else {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [28, 28], animate: false });
    }
  // We only want this to run when the coords themselves change, not on every render.
  // JSON stringify is cheap for small arrays.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(markers)]);
  return null;
}

export default function MiniMap({ markers, height = 190, singleZoom }: Props) {
  const center: [number, number] =
    markers.length === 1 ? [markers[0].lat, markers[0].lng] : PANAMA;
  const zoom = markers.length === 1 ? (singleZoom ?? 14) : 8;

  return (
    <div style={{ overflow: 'hidden', borderRadius: 8 }}>
      <MapContainer
        key={center.join(',')}
        center={center}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        attributionControl={false}
        style={{ height, width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AutoFit markers={markers} singleZoom={singleZoom} />
        {markers.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]} />
        ))}
      </MapContainer>
    </div>
  );
}
