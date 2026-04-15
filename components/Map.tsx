'use client';

import { getSpotIconName, createSpotDivIcon } from './SpotMarkerIcon';
import { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SpotForm from '@/components/SpotForm';
import MapLegend from '@/components/MapLegend';
import SpotReviews from '@/components/SpotReviews';
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
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [spotPanelView, setSpotPanelView] = useState<'overview' | 'details'>('overview');
  const [deleteSpot, setDeleteSpot] = useState<Spot | null>(null);
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

  const selectedSpot = selectedSpotId
    ? (visibleSpots.find((spot) => spot.id === selectedSpotId) ??
      spots.find((spot) => spot.id === selectedSpotId) ??
      null)
    : null;
  const isSpotPanelOpen = selectedSpot !== null;

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

  useEffect(() => {
    if (!isSpotPanelOpen) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedSpotId(null);
        setSpotPanelView('overview');
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isSpotPanelOpen]);

  function handleMapClick(latlng: [number, number]) {
    setSelectedSpotId(null);
    setSpotPanelView('overview');
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
    setSelectedSpotId(null);
    setSpotPanelView('overview');
    setEditingSpot(spot);
    setPendingPosition([spot.latitude, spot.longitude]);
  }

  function handleDeleteSpot(spot: Spot) {
    if (!userId) return;
    // Allow if owner or admin
    if (spot.user_id !== userId && userRole !== 'admin') return;
    setDeleteSpot(spot);
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
    setDeleteSpot(null);
  }

  function handleCancelPin() {
    setPendingPosition(null);
  }

  function handleSelectSpot(spotId: string) {
    setPendingPosition(null);
    setEditingSpot(null);
    setDeleteSpot(null);
    setFavError(null);
    setSelectedSpotId(spotId);
    setSpotPanelView('overview');
  }

  function handleCloseSpotPanel() {
    setSelectedSpotId(null);
    setSpotPanelView('overview');
    setDeleteSpot(null);
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
    <div className="flex w-full flex-col gap-3 sm:gap-4">
      <div className="mt-4 sm:mt-6">
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
      <div className="relative">
        <div
          className={`relative h-[55svh] min-h-[420px] overflow-hidden rounded-xl border border-border shadow-sm sm:h-[62svh] sm:min-h-[520px] lg:h-[68svh] lg:max-h-[820px] ${
            isSpotPanelOpen ? 'map-controls-hidden' : ''
          }`}
        >
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
                  minWidth={260}
                  maxWidth={360}
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
                eventHandlers={{
                  click: () => handleSelectSpot(spot.id),
                }}
              ></Marker>
            ))}
          </MapContainer>
        </div>
        {selectedSpot && (
          <div className="pointer-events-none absolute inset-x-3 bottom-4 z-[500] sm:inset-y-4 sm:right-4 sm:left-auto sm:w-[24rem]">
            <div className="pointer-events-auto flex max-h-[75svh] flex-col overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur sm:h-full sm:max-h-none">
              <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Spot details
                  </p>
                  <h3 className="mt-1 text-sm font-semibold leading-tight text-foreground sm:text-base">
                    {selectedSpot.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseSpotPanel}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-border bg-background text-lg leading-none text-foreground hover:bg-muted"
                  aria-label="Close spot details"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 border-b border-border bg-muted/40 p-1.5">
                <button
                  type="button"
                  onClick={() => setSpotPanelView('overview')}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                    spotPanelView === 'overview'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setSpotPanelView('details')}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                    spotPanelView === 'details'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Reviews & notes
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 text-foreground">
                {spotPanelView === 'overview' ? (
                  <div className="flex flex-col gap-3">
                    {selectedSpot.image_url && (
                      <button
                        type="button"
                        className="h-40 w-full cursor-pointer rounded-xl border-0 bg-transparent p-0 object-cover focus:outline-none"
                        onClick={() =>
                          openImagePreview(selectedSpot.image_url as string, selectedSpot.name)
                        }
                        title="Click to view larger"
                        aria-label="View larger image"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            openImagePreview(selectedSpot.image_url as string, selectedSpot.name);
                          }
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedSpot.image_url}
                          alt={selectedSpot.name}
                          className="h-40 w-full rounded-xl object-cover"
                        />
                      </button>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-sky-500/60 px-2.5 py-1 text-[11px] font-medium text-white">
                        {selectedSpot.spot_type}
                      </span>
                      {selectedSpot.street_feature && (
                        <span className="rounded-full bg-purple-500/60 px-2.5 py-1 text-[11px] font-medium text-white">
                          {selectedSpot.street_feature}
                        </span>
                      )}
                      <span className="rounded-full bg-emerald-500/60 px-2.5 py-1 text-[11px] font-medium text-white">
                        {selectedSpot.difficulty}
                      </span>
                      <span className="rounded-full bg-amber-500/70 px-2.5 py-1 text-[11px] font-medium text-white">
                        Bust {selectedSpot.bust_factor}/5
                      </span>
                    </div>

                    {selectedSpot.address && (
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {selectedSpot.address}
                      </p>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {userId && (
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
                          aria-label={
                            isFavourite(selectedSpot.id)
                              ? 'Remove from favourites'
                              : 'Add to favourites'
                          }
                          onClick={async () => {
                            setFavError(null);
                            if (isFavourite(selectedSpot.id)) {
                              await removeFavourite(selectedSpot.id);
                            } else {
                              const { error } = await addFavourite(selectedSpot.id);
                              if (error) {
                                setFavError(error.message || 'Could not add favourite.');
                              }
                            }
                          }}
                        >
                          {isFavourite(selectedSpot.id) ? (
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
                          {isFavourite(selectedSpot.id) ? 'Saved' : 'Save'}
                        </button>
                      )}
                    </div>

                    {favError && <div className="text-xs text-red-500">{favError}</div>}

                    {userId && (selectedSpot.user_id === userId || userRole === 'admin') && (
                      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                        <button
                          className="min-h-10 rounded-xl border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/80"
                          onClick={() => handleEditSpot(selectedSpot)}
                        >
                          Edit
                        </button>
                        <button
                          className="min-h-10 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                          onClick={() => handleDeleteSpot(selectedSpot)}
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    {deleteSpot && deleteSpot.id === selectedSpot.id && (
                      <div className="rounded-xl border border-border bg-background p-3 shadow">
                        <p className="text-sm text-foreground">
                          Delete <span className="font-bold">{deleteSpot.name}</span>?
                        </p>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <button
                            className="min-h-10 rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
                            onClick={confirmDeleteSpot}
                          >
                            Delete
                          </button>
                          <button
                            className="min-h-10 rounded-xl border border-border bg-muted px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/80"
                            onClick={cancelDeleteSpot}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {selectedSpot.description ? (
                      <div className="rounded-xl border border-border bg-muted/30 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Description
                        </p>
                        <p className="mt-2 whitespace-pre-line break-words text-xs leading-relaxed text-foreground">
                          {selectedSpot.description}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                        No description added for this spot yet.
                      </div>
                    )}

                    <SpotReviews spotId={selectedSpot.id} userId={userId} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
          <div className="flex w-full max-w-3xl flex-col gap-3 rounded-lg bg-background p-3 sm:p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={expandedImage.url}
              alt={expandedImage.name}
              className="max-h-[75vh] w-full rounded object-contain"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <a
                href={getImageDownloadHref(expandedImage.url, expandedImage.name)}
                download
                className="rounded bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
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
