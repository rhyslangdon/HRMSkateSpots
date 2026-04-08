'use client';

import type { SpotType, StreetFeature, Difficulty } from '@/types';
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
}: MapLegendProps) {
  const streetHidden = hiddenTypes.has('street');
  const hasActiveFilters =
    hiddenTypes.size > 0 || hiddenFeatures.size > 0 || hiddenDifficulties.size > 0;
  const allHidden =
    hiddenTypes.size === SPOT_TYPES.length && hiddenDifficulties.size === DIFFICULTIES.length;

  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-sm transition-colors">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Spot Types</p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="rounded px-2 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-default disabled:text-muted-foreground"
          >
            Show All
          </button>
          <button
            type="button"
            onClick={onHideAll}
            disabled={allHidden}
            className="rounded px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-default disabled:text-muted-foreground/60"
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
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all hover:bg-muted ${
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
                  style={{ fontSize: '12px', color: ICON_COLOR }}
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
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all hover:bg-muted ${
              showFavouritesOnly ? 'border-pink-300 bg-pink-50' : 'border-border opacity-40'
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
                style={{ fontSize: '12px', color: '#e91e63' }}
              >
                favorite
              </span>
            </span>
            <span className="text-foreground">Favourites</span>
          </button>
        )}
      </div>

      {/* Difficulty & Street Features side by side */}
      <div className="mt-2 grid grid-cols-2 gap-0 border-t border-border pt-2">
        {/* Difficulty */}
        <div className="pr-3">
          <p className="mb-1.5 text-[10px] font-semibold text-muted-foreground">Difficulty</p>
          <div className="flex flex-wrap gap-1">
            {DIFFICULTIES.map((difficulty) => {
              const isHidden = hiddenDifficulties.has(difficulty);
              return (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() => onToggleDifficulty(difficulty)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all hover:ring-1 hover:ring-primary/40 ${
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

        {/* Street Features */}
        {!streetHidden && (
          <div className="border-l border-border pl-3">
            <p className="mb-1.5 text-[10px] font-semibold text-muted-foreground">
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
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all hover:ring-1 hover:ring-primary/40 ${
                      isHidden
                        ? 'border border-border bg-background text-muted-foreground'
                        : 'bg-purple-100 text-foreground'
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
    </div>
  );
}
