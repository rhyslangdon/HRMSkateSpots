'use client';

import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SpotForm from '@/components/SpotForm';
import type { Spot } from '@/types';

// Fix default marker icon paths (broken by webpack bundling)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Center on Halifax Regional Municipality
const HRM_CENTER: [number, number] = [44.6488, -63.5752];
const DEFAULT_ZOOM = 12;

function ClickHandler({ onMapClick }: { onMapClick: (latlng: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function Map() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [pendingPosition, setPendingPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    async function loadSpots() {
      try {
        const res = await fetch('/api/spots');
        if (res.ok) {
          const { data } = await res.json();
          setSpots(data ?? []);
        }
      } catch {
        // silently fail — map still usable without spots
      }
    }
    loadSpots();
  }, []);

  function handleMapClick(latlng: [number, number]) {
    setPendingPosition(latlng);
  }

  function handleSpotSaved() {
    setPendingPosition(null);
    async function reload() {
      try {
        const res = await fetch('/api/spots');
        if (res.ok) {
          const { data } = await res.json();
          setSpots(data ?? []);
        }
      } catch {
        // silently fail
      }
    }
    reload();
  }

  function handleCancelPin() {
    setPendingPosition(null);
  }

  const pendingMarkerRef = useCallback((marker: L.Marker | null) => {
    if (marker) marker.openPopup();
  }, []);

  return (
    <MapContainer
      center={HRM_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={true}
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={handleMapClick} />
      {pendingPosition && (
        <Marker position={pendingPosition} ref={pendingMarkerRef}>
          <Popup eventHandlers={{ remove: handleCancelPin }} minWidth={240} maxWidth={300}>
            <SpotForm
              latitude={pendingPosition[0]}
              longitude={pendingPosition[1]}
              onSaved={handleSpotSaved}
              onCancel={handleCancelPin}
            />
          </Popup>
        </Marker>
      )}
      {spots.map((spot) => (
        <Marker key={spot.id} position={[spot.latitude, spot.longitude]}>
          <Popup minWidth={220} maxWidth={280}>
            <div className="flex flex-col gap-2">
              {spot.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={spot.image_url}
                  alt={spot.name}
                  className="h-32 w-full rounded object-cover"
                />
              )}
              <p className="text-sm font-semibold">{spot.name}</p>
              {spot.description && <p className="text-xs text-gray-600">{spot.description}</p>}
              <div className="flex flex-wrap gap-1">
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                  {spot.spot_type}
                </span>
                {spot.street_feature && (
                  <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                    {spot.street_feature}
                  </span>
                )}
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                  {spot.difficulty}
                </span>
              </div>
              {spot.address && <p className="text-[10px] text-gray-400">{spot.address}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
