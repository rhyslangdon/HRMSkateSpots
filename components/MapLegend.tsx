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
}: MapLegendProps) {
  const streetHidden = hiddenTypes.has('street');
  const hasActiveFilters =
    hiddenTypes.size > 0 || hiddenFeatures.size > 0 || hiddenDifficulties.size > 0;
  const allHidden =
    hiddenTypes.size === SPOT_TYPES.length && hiddenDifficulties.size === DIFFICULTIES.length;

  return (
    <div className="rounded-lg border border-border bg-white/95 p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700">Spot Types</p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="rounded px-2 py-0.5 text-[10px] font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-default disabled:text-gray-300"
          >
            Show All
          </button>
          <button
            type="button"
            onClick={onHideAll}
            disabled={allHidden}
            className="rounded px-2 py-0.5 text-[10px] font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-default disabled:text-gray-300"
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
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all hover:bg-gray-100 ${
                isHidden ? 'border-gray-200 opacity-40' : 'border-blue-200 bg-blue-50'
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
                  style={{ fontSize: '14px', color: ICON_COLOR }}
                >
                  {icon}
                </span>
              </span>
              <span className="text-gray-700">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Street features sub-legend */}
      {!streetHidden && (
        <div className="mt-2 border-t border-gray-100 pt-2">
          <p className="mb-1.5 text-[10px] font-semibold text-gray-500">Street Features</p>
          <div className="flex flex-wrap gap-1">
            {STREET_FEATURES.map((feature) => {
              const isHidden = hiddenFeatures.has(feature);
              return (
                <button
                  key={feature}
                  type="button"
                  onClick={() => onToggleFeature(feature)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all hover:ring-1 hover:ring-purple-300 ${
                    isHidden
                      ? 'bg-gray-100 text-gray-400 opacity-50'
                      : 'bg-purple-100 text-purple-700'
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

      {/* Difficulty filter */}
      <div className="mt-2 border-t border-gray-100 pt-2">
        <p className="mb-1.5 text-[10px] font-semibold text-gray-500">Difficulty</p>
        <div className="flex flex-wrap gap-1">
          {DIFFICULTIES.map((difficulty) => {
            const isHidden = hiddenDifficulties.has(difficulty);
            return (
              <button
                key={difficulty}
                type="button"
                onClick={() => onToggleDifficulty(difficulty)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all hover:ring-1 hover:ring-green-300 ${
                  isHidden ? 'bg-gray-100 text-gray-400 opacity-50' : 'bg-green-100 text-green-700'
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
    </div>
  );
}
