import { getSpotIconName, createSpotDivIcon } from './SpotMarkerIcon';
('use client');

import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SpotForm from '@/components/SpotForm';
import MapLegend from '@/components/MapLegend';
import { createClient } from '@/lib/supabase/client';
import type { Spot, SpotType, StreetFeature, Difficulty } from '@/types';

const SPOT_TYPES: SpotType[] = ['street', 'park', 'diy', 'transition', 'flatground', 'other'];
const STREET_FEATURES: StreetFeature[] = ['ledge', 'stairs', 'handrail', 'gap', 'bank', 'other'];
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'all'];

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
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
  const [editingSpot, setEditingSpot] = useState<Spot | null>(null);
  const [deleteSpot, setDeleteSpot] = useState<Spot | null>(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState<Set<SpotType>>(new Set());
  const [hiddenFeatures, setHiddenFeatures] = useState<Set<StreetFeature>>(new Set());
  const [hiddenDifficulties, setHiddenDifficulties] = useState<Set<Difficulty>>(new Set());

  function handleToggleType(type: SpotType) {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function handleToggleFeature(feature: StreetFeature) {
    setHiddenFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(feature)) next.delete(feature);
      else next.add(feature);
      return next;
    });
  }

  function handleToggleDifficulty(difficulty: Difficulty) {
    setHiddenDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(difficulty)) next.delete(difficulty);
      else next.add(difficulty);
      return next;
    });
  }

  function handleReset() {
    setHiddenTypes(new Set());
    setHiddenFeatures(new Set());
    setHiddenDifficulties(new Set());
  }

  function handleHideAll() {
    setHiddenTypes(new Set(SPOT_TYPES));
    setHiddenFeatures(new Set(STREET_FEATURES));
    setHiddenDifficulties(new Set(DIFFICULTIES));
  }

  const visibleSpots = spots.filter((s) => {
    if (hiddenTypes.has(s.spot_type)) return false;
    if (s.spot_type === 'street' && s.street_feature && hiddenFeatures.has(s.street_feature))
      return false;
    if (hiddenDifficulties.has(s.difficulty)) return false;
    return true;
  });

  useEffect(() => {
    const supabase = createClient();
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
    // Fetch user ID and role
    async function fetchUserProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);
        if (user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          setUserRole(profile?.role ?? null);
        } else {
          setUserRole(null);
        }
      } catch {
        setUserId(null);
        setUserRole(null);
      }
    }
    fetchUserProfile();
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (session?.user?.id) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => setUserRole(profile?.role ?? null));
      } else {
        setUserRole(null);
      }
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  function handleMapClick(latlng: [number, number]) {
    setPendingPosition(latlng);
  }

  function handleSpotSaved() {
    setPendingPosition(null);
    setEditingSpot(null);
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

  function handleEditSpot(spot: Spot) {
    setEditingSpot(spot);
    setPendingPosition([spot.latitude, spot.longitude]);
  }

  function handleDeleteSpot(spot: Spot) {
    if (!userId) return;
    // Allow if owner or admin
    if (spot.user_id !== userId && userRole !== 'admin') return;
    setDeleteSpot(spot);
    setShowDeletePopup(true);
  }

  async function confirmDeleteSpot() {
    if (!deleteSpot) return;
    try {
      const res = await fetch('/api/spots', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteSpot.id }),
      });
      if (res.ok) {
        handleSpotSaved();
        setShowDeletePopup(false);
        setDeleteSpot(null);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete spot.');
      }
    } catch {
      alert('Network error. Please try again.');
    }
  }

  function cancelDeleteSpot() {
    setShowDeletePopup(false);
    setDeleteSpot(null);
  }

  function handleCancelPin() {
    setPendingPosition(null);
  }

  const pendingMarkerRef = useCallback((marker: L.Marker | null) => {
    if (marker) marker.openPopup();
  }, []);

  return (
    <div className="flex w-full flex-col gap-3">
      <MapLegend
        hiddenTypes={hiddenTypes}
        onToggleType={handleToggleType}
        hiddenFeatures={hiddenFeatures}
        onToggleFeature={handleToggleFeature}
        hiddenDifficulties={hiddenDifficulties}
        onToggleDifficulty={handleToggleDifficulty}
        onReset={handleReset}
        onHideAll={handleHideAll}
      />
      <div className="h-[500px] overflow-hidden rounded-xl border border-border shadow-sm">
        <MapContainer
          center={HRM_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          className="h-full w-full rounded-xl"
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Simple">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &amp; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Standard">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Light">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &amp; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Dark">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &amp; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          <ClickHandler onMapClick={handleMapClick} />
          {pendingPosition && (
            <Marker position={pendingPosition} ref={pendingMarkerRef}>
              <Popup eventHandlers={{ remove: handleCancelPin }} minWidth={240} maxWidth={300}>
                <SpotForm
                  latitude={pendingPosition[0]}
                  longitude={pendingPosition[1]}
                  onSaved={handleSpotSaved}
                  onCancel={handleCancelPin}
                  {...(editingSpot ? { initialData: editingSpot } : {})}
                />
              </Popup>
            </Marker>
          )}
          {visibleSpots.map((spot) => (
            <Marker
              key={spot.id}
              position={[spot.latitude, spot.longitude]}
              icon={createSpotDivIcon(getSpotIconName(spot))}
            >
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
                  {userId && (spot.user_id === userId || userRole === 'admin') && (
                    <div className="flex gap-2 mt-2">
                      <button
                        className="rounded bg-yellow-500 px-2 py-1 text-xs text-white hover:bg-yellow-600"
                        onClick={() => handleEditSpot(spot)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                        onClick={() => handleDeleteSpot(spot)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  {deleteSpot && deleteSpot.id === spot.id && (
                    <div className="mt-2 p-2 rounded bg-white shadow flex flex-col items-center">
                      <p className="text-sm mb-4">
                        Are you sure you want to delete{' '}
                        <span className="font-bold">{deleteSpot.name}</span>?
                      </p>
                      <div className="flex gap-2">
                        <button
                          className="rounded bg-red-500 px-4 py-1 text-xs text-white hover:bg-red-600"
                          onClick={confirmDeleteSpot}
                        >
                          Delete
                        </button>
                        <button
                          className="rounded bg-gray-200 px-4 py-1 text-xs text-gray-700 hover:bg-gray-300"
                          onClick={cancelDeleteSpot}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
