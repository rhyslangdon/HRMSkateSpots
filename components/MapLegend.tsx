'use client';

import type { SpotType } from '@/types';
import { getSpotIconName } from './SpotMarkerIcon';

const SPOT_TYPE_CONFIG: { type: SpotType; label: string; color: string }[] = [
  { type: 'street', label: 'Street', color: '#1976d2' },
  { type: 'park', label: 'Park', color: '#1976d2' },
  { type: 'diy', label: 'DIY', color: '#1976d2' },
  { type: 'transition', label: 'Transition', color: '#1976d2' },
  { type: 'flatground', label: 'Flatground', color: '#1976d2' },
  { type: 'other', label: 'Other', color: '#1976d2' },
];

interface MapLegendProps {
  hiddenTypes: Set<SpotType>;
  onToggleType: (type: SpotType) => void;
}

export default function MapLegend({ hiddenTypes, onToggleType }: MapLegendProps) {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border border-border bg-white/95 p-3 shadow-md backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold text-gray-700">Spot Types</p>
      <ul className="flex flex-col gap-1.5">
        {SPOT_TYPE_CONFIG.map(({ type, label, color }) => {
          const isHidden = hiddenTypes.has(type);
          // Use getSpotIconName to get the icon name for this type
          const icon = getSpotIconName({ spot_type: type });
          return (
            <li key={type}>
              <button
                type="button"
                onClick={() => onToggleType(type)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-opacity hover:bg-gray-100 ${
                  isHidden ? 'opacity-40' : 'opacity-100'
                }`}
                aria-pressed={!isHidden}
                aria-label={`${isHidden ? 'Show' : 'Hide'} ${label} spots`}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: color,
                    background: 'white',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color }}>
                    {icon}
                  </span>
                </span>
                <span className="text-gray-700">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
