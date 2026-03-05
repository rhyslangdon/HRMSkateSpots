'use client';

import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Center on Halifax Regional Municipality
const HRM_CENTER: [number, number] = [44.6488, -63.5752];
const DEFAULT_ZOOM = 12;

export default function Map() {
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
    </MapContainer>
  );
}
