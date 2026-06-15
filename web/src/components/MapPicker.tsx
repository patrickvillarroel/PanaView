import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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

export interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

/** Coloca/mueve el marcador al hacer clic en el mapa. */
function ClickHandler({ onChange }: Pick<MapPickerProps, 'onChange'>) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Centra el mapa en las coordenadas iniciales una sola vez al montar. */
function InitialCenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current && lat != null && lng != null) {
      map.setView([lat, lng], 14, { animate: false });
      done.current = true;
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer
        center={PANAMA}
        zoom={8}
        scrollWheelZoom={false}
        style={{ height: 280, width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <InitialCenter lat={lat} lng={lng} />
        <ClickHandler onChange={onChange} />
        {lat != null && lng != null && (
          <Marker
            position={[lat, lng]}
            draggable
            eventHandlers={{
              dragend(e) {
                const pos = (e.target as L.Marker).getLatLng();
                onChange(pos.lat, pos.lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
