'use client';

import { useState } from 'react';
import type { SpotType, StreetFeature, Difficulty } from '@/types';
import { MotionDropdown, MotionPresence } from '@/components/Motion';
import { getSpotIconName } from './SpotMarkerIcon';

const SPOT_TYPES: SpotType[] = ['street', 'park', 'diy', 'transition', 'flatground', 'other'];
const STREET_FEATURES: StreetFeature[] = ['ledge', 'stairs', 'handrail', 'gap', 'bank', 'other'];
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'all'];
const ICON_COLOR = '#1976d2';

function formatLabel(value: string): string {
  return value === 'diy' ? 'DIY' : value.charAt(0).toUpperCase() + value.slice(1);
}

interface MapLegendProps {
  hiddenTypes: Set<SpotType>;
  onToggleType: (type: SpotType) => void;
  hiddenFeatures: Set<StreetFeature>;
  onToggleFeature: (feature: StreetFeature) => void;
  hiddenDifficulties: Set<Difficulty>;
  onToggleDifficulty: (difficulty: Difficulty) => void;
  onReset: () => void;
  onHideAll: () => void;
  showFavouritesOnly?: boolean;
  onToggleFavourites?: () => void;
  showSecretOnly?: boolean;
  onToggleSecret?: () => void;
}

export default function MapLegend({
  hiddenTypes,
  onToggleType,
  hiddenFeatures,
  onToggleFeature,
  hiddenDifficulties,
  onToggleDifficulty,
  onReset,
  onHideAll,
  showFavouritesOnly,
  onToggleFavourites,
  showSecretOnly,
  onToggleSecret,
}: MapLegendProps) {
  const [isOpen, setIsOpen] = useState(false);
  const streetHidden = hiddenTypes.has('street');
  const hasActiveFilters =
    hiddenTypes.size > 0 ||
    hiddenFeatures.size > 0 ||
    hiddenDifficulties.size > 0 ||
    Boolean(showFavouritesOnly) ||
    Boolean(showSecretOnly);
  const allHidden =
    hiddenTypes.size === SPOT_TYPES.length && hiddenDifficulties.size === DIFFICULTIES.length;

  return (
    <div className="transition-colors sm:rounded-lg sm:border sm:border-border sm:bg-background sm:p-4 sm:shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="hidden text-xs sm:text-base font-semibold sm:block text-foreground">
            Map Filters
          </p>
          <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
            Toggle spot types, favourites, secret spots, difficulty, and street features.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:min-h-0 sm:w-auto sm:justify-start sm:py-1.5"
          aria-expanded={isOpen}
          aria-controls="map-filters-panel"
        >
          {isOpen ? 'Hide Filters' : 'Show Filters'}
          <span className="material-symbols-outlined text-sm text-muted-foreground">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>
      <MotionPresence>
        {isOpen && (
          <MotionDropdown id="map-filters-panel" key="map-filters-panel" className="mt-3">
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-foreground">Spot Types</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={onReset}
                  disabled={!hasActiveFilters}
                  className="min-h-8 rounded px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-default disabled:text-muted-foreground"
                >
                  Show All
                </button>
                <button
                  type="button"
                  onClick={onHideAll}
                  disabled={allHidden}
                  className="min-h-8 rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-default disabled:text-muted-foreground/60"
                >
                  Hide All
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SPOT_TYPES.map((type) => {
                const isHidden = hiddenTypes.has(type);
                const icon = getSpotIconName({ spot_type: type });
                const label = formatLabel(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onToggleType(type)}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm transition-all hover:bg-muted ${
                      isHidden
                        ? 'border-border bg-background text-muted-foreground'
                        : 'border-primary/30 bg-primary/10 text-foreground'
                    }`}
                    aria-pressed={!isHidden}
                    aria-label={`${isHidden ? 'Show' : 'Hide'} ${label} spots`}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                      style={{ borderColor: ICON_COLOR, background: 'white' }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '13px', color: ICON_COLOR }}
                      >
                        {icon}
                      </span>
                    </span>
                    <span className="text-foreground">{label}</span>
                  </button>
                );
              })}
              {onToggleFavourites && (
                <button
                  type="button"
                  onClick={onToggleFavourites}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm transition-all hover:bg-muted ${
                    showFavouritesOnly
                      ? 'border-pink-300 bg-pink-50 text-foreground'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                  aria-pressed={showFavouritesOnly}
                  aria-label={showFavouritesOnly ? 'Show all spots' : 'Show favourites only'}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                    style={{ borderColor: '#e91e63', background: 'white' }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '13px', color: '#e91e63' }}
                    >
                      favorite
                    </span>
                  </span>
                  <span className="text-foreground">
                    {showFavouritesOnly ? 'Favourites Only' : 'Favourites'}
                  </span>
                </button>
              )}
              {onToggleSecret && (
                <button
                  type="button"
                  onClick={onToggleSecret}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm transition-all hover:bg-muted ${
                    showSecretOnly
                      ? 'border-amber-300 bg-amber-50 text-foreground'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                  aria-pressed={showSecretOnly}
                  aria-label={showSecretOnly ? 'Show all visible spots' : 'Show secret spots only'}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                    style={{ borderColor: '#b45309', background: 'white' }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: '13px', color: '#b45309' }}
                    >
                      visibility_lock
                    </span>
                  </span>
                  <span className="text-foreground">
                    {showSecretOnly ? 'Secret Only' : 'Secret Spots'}
                  </span>
                </button>
              )}
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2 border-t border-border pt-2 sm:grid-cols-2 sm:gap-0">
              <div className="sm:pr-3">
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Difficulty</p>
                <div className="flex flex-wrap gap-1">
                  {DIFFICULTIES.map((difficulty) => {
                    const isHidden = hiddenDifficulties.has(difficulty);
                    return (
                      <button
                        key={difficulty}
                        type="button"
                        onClick={() => onToggleDifficulty(difficulty)}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium transition-all hover:ring-1 hover:ring-primary/40 ${
                          isHidden
                            ? 'border border-border bg-background text-muted-foreground'
                            : 'bg-primary/15 text-foreground'
                        }`}
                        aria-pressed={!isHidden}
                        aria-label={`${isHidden ? 'Show' : 'Hide'} ${formatLabel(difficulty)} spots`}
                      >
                        {formatLabel(difficulty)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!streetHidden && (
                <div className="sm:border-l sm:border-border sm:pl-3">
                  <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                    Street Features
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {STREET_FEATURES.map((feature) => {
                      const isHidden = hiddenFeatures.has(feature);
                      return (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => onToggleFeature(feature)}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium transition-all hover:ring-1 hover:ring-primary/40 ${
                            isHidden
                              ? 'border border-border bg-background text-muted-foreground'
                              : 'bg-primary/15 text-foreground'
                          }`}
                          aria-pressed={!isHidden}
                          aria-label={`${isHidden ? 'Show' : 'Hide'} ${formatLabel(feature)} street spots`}
                        >
                          {formatLabel(feature)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </MotionDropdown>
        )}
      </MotionPresence>
    </div>
  );
}
