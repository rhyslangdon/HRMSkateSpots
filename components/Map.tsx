'use client';

import { getSpotIconName, createSpotDivIcon } from './SpotMarkerIcon';
import { useCallback, useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  LayersControl,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SpotForm from '@/components/SpotForm';
import MapLegend from '@/components/MapLegend';
import { createClient } from '@/lib/supabase/client';
import type { Spot, SpotType, StreetFeature, Difficulty } from '@/types';
import { useFavourites } from '@/hooks/useFavourites';
import { useTheme } from '@/components/ThemeContext';

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
  const { theme } = useTheme();
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
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);
  const [expandedImage, setExpandedImage] = useState<{ url: string; name: string } | null>(null);

  // Favourites logic
  const { addFavourite, removeFavourite, isFavourite } = useFavourites(userId);
  const [favError, setFavError] = useState<string | null>(null);

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
    setShowFavouritesOnly(false);
  }

  function handleHideAll() {
    setHiddenTypes(new Set(SPOT_TYPES));
    setHiddenFeatures(new Set(STREET_FEATURES));
    setHiddenDifficulties(new Set(DIFFICULTIES));
  }

  const visibleSpots = spots.filter((s) => {
    if (showFavouritesOnly && userId) {
      return isFavourite(s.id);
    }
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
        // silently fail - map still usable without spots
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

  function openImagePreview(imageUrl: string, spotName: string) {
    setExpandedImage({ url: imageUrl, name: spotName });
  }

  function closeImagePreview() {
    setExpandedImage(null);
  }

  function getImageDownloadHref(imageUrl: string, spotName: string) {
    const params = new URLSearchParams({
      url: imageUrl,
      name: spotName,
    });
    return `/api/download-image?${params.toString()}`;
  }

  const pendingMarkerRef = useCallback((marker: L.Marker | null) => {
    if (marker) marker.openPopup();
  }, []);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="mt-6">
        <MapLegend
          hiddenTypes={hiddenTypes}
          onToggleType={handleToggleType}
          hiddenFeatures={hiddenFeatures}
          onToggleFeature={handleToggleFeature}
          hiddenDifficulties={hiddenDifficulties}
          onToggleDifficulty={handleToggleDifficulty}
          onReset={handleReset}
          onHideAll={handleHideAll}
          showFavouritesOnly={showFavouritesOnly}
          onToggleFavourites={userId ? () => setShowFavouritesOnly((value) => !value) : undefined}
        />
      </div>
      {/* Location search is temporarily disabled. */}
      <div className="h-[500px] overflow-hidden rounded-xl border border-border shadow-sm">
        <MapContainer
          key={`map-${theme}`}
          center={HRM_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          className="h-full w-full rounded-xl"
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked={theme === 'light'} name="Simple">
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
            <LayersControl.BaseLayer checked={theme === 'dark'} name="Dark">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &amp; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          <ClickHandler onMapClick={handleMapClick} />
          {pendingPosition && (
            <Marker position={pendingPosition} ref={pendingMarkerRef}>
              <Popup
                eventHandlers={{ remove: handleCancelPin }}
                minWidth={240}
                maxWidth={300}
                className="spot-popup"
              >
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
              <Popup minWidth={220} maxWidth={280} className="spot-popup">
                <div className="flex flex-col gap-2 text-foreground">
                  <strong className="text-sm text-foreground">{spot.name}</strong>
                  {spot.description && (
                    <p className="text-xs text-muted-foreground whitespace-pre-line break-words max-w-[240px]">
                      {spot.description}
                    </p>
                  )}
                  {spot.image_url && (
                    <button
                      type="button"
                      className="p-0 border-0 bg-transparent h-32 w-full cursor-pointer rounded object-cover focus:outline-none"
                      onClick={() => openImagePreview(spot.image_url as string, spot.name)}
                      title="Click to view larger"
                      aria-label="View larger image"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          openImagePreview(spot.image_url as string, spot.name);
                        }
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={spot.image_url}
                        alt={spot.name}
                        className="h-32 w-full rounded object-cover"
                      />
                    </button>
                  )}
                  <div className="flex flex-wrap gap-1">
                    <span className="rounded-full bg-sky-500/60 px-2 py-1 text-xs font-medium text-white">
                      {spot.spot_type}
                    </span>
                    {spot.street_feature && (
                      <span className="rounded-full bg-purple-500/60 px-2 py-1 text-xs font-medium text-white">
                        {spot.street_feature}
                      </span>
                    )}
                    <span className="rounded-full bg-emerald-500/60 px-2 py-1 text-xs font-medium text-white">
                      {spot.difficulty}
                    </span>
                  </div>
                  {spot.address && (
                    <p className="text-[10px] text-muted-foreground">{spot.address}</p>
                  )}
                  {userId && (
                    <button
                      className="ml-auto flex items-center gap-1 text-primary hover:text-primary/80 focus:outline-none"
                      aria-label={
                        isFavourite(spot.id) ? 'Remove from favourites' : 'Add to favourites'
                      }
                      onClick={async () => {
                        setFavError(null);
                        if (isFavourite(spot.id)) {
                          await removeFavourite(spot.id);
                        } else {
                          const { error } = await addFavourite(spot.id);
                          if (error) {
                            setFavError(error.message || 'Could not add favourite.');
                          } else {
                            setFavError(null);
                          }
                        }
                      }}
                    >
                      {isFavourite(spot.id) ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          className="h-5 w-5"
                        >
                          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 20"
                          stroke="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          />
                        </svg>
                      )}
                    </button>
                  )}
                  {favError && <div className="mt-1 text-xs text-red-500">{favError}</div>}
                  {userId && (spot.user_id === userId || userRole === 'admin') && (
                    <div className="mt-2 flex gap-2">
                      <button
                        className="rounded border border-border bg-muted px-2 py-1 text-xs text-foreground hover:bg-muted/80"
                        onClick={() => handleEditSpot(spot)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                        onClick={() => handleDeleteSpot(spot)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  {deleteSpot && deleteSpot.id === spot.id && (
                    <div className="mt-2 flex flex-col items-center rounded border border-border bg-background p-2 shadow">
                      <p className="mb-4 text-sm text-foreground">
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
                          className="rounded border border-border bg-muted px-4 py-1 text-xs text-foreground hover:bg-muted/80"
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
      {expandedImage && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeImagePreview();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close image preview"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              closeImagePreview();
            }
          }}
        >
          <div className="flex w-full max-w-3xl flex-col gap-3 rounded-lg bg-background p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={expandedImage.url}
              alt={expandedImage.name}
              className="max-h-[75vh] w-full rounded object-contain"
            />
            <div className="flex items-center justify-end gap-2">
              <a
                href={getImageDownloadHref(expandedImage.url, expandedImage.name)}
                download
                className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Download image
              </a>
              <button
                type="button"
                onClick={closeImagePreview}
                className="rounded border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
