// SpotMarkerIcon.tsx
// Returns a Material Symbol icon name for a given spot type/feature
import L from 'leaflet';

const iconCache = new Map<string, L.DivIcon>();

export function getSpotIconName(spot: { spot_type: string; street_feature?: string | null }) {
  switch (spot.spot_type) {
    case 'street':
      return 'fire_hydrant';
    case 'park':
      return 'flag';
    case 'diy':
      return 'build';
    case 'transition':
      return 'waves';
    case 'flatground':
      return 'crop_square';
    default:
      return 'location_on';
  }
}

// Returns a Leaflet DivIcon with Material Symbol
export function createSpotDivIcon(iconName: string, color = '#1976d2') {
  const cacheKey = `${iconName}:${color}`;
  const cachedIcon = iconCache.get(cacheKey);

  if (cachedIcon) {
    return cachedIcon;
  }

  const icon = L.divIcon({
    className: 'spot-marker-icon',
    html: `
      <div class="spot-marker-icon__inner" style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        border: 2px solid ${color};
      ">
        <span class="material-symbols-outlined" style="font-size:22px;color:${color};">
          ${iconName}
        </span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  iconCache.set(cacheKey, icon);
  return icon;
}
