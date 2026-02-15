import L from 'leaflet';
import { ANIMAL_MARKER_CONFIG } from '@/features/report/constants/animalMarkerConfig';

/** ステータスに対応するボーダー色 */
export const STATUS_BORDER_COLORS: Record<string, string> = {
  waiting: '#ec0000',
  completed: '#3460fb',
};

/**
 * アイコンインスタンスのキャッシュ
 * キー: "animalType|isSelected|statusBorderColor|isOutOfRange" の形式
 * 同じパラメータの組み合わせに対して同一の L.DivIcon インスタンスを返す
 */
const iconCache = new Map<string, L.DivIcon>();

export function createAnimalIcon(
  animalType: string,
  isSelected = false,
  statusBorderColor?: string,
  isOutOfRange = false
): L.DivIcon {
  const cacheKey = `${animalType}|${isSelected}|${statusBorderColor ?? ''}|${isOutOfRange}`;
  const cached = iconCache.get(cacheKey);
  if (cached) return cached;

  const config = ANIMAL_MARKER_CONFIG[animalType] || ANIMAL_MARKER_CONFIG.other;
  const size = isSelected ? 48 : 36;
  const fontSize = isSelected ? 24 : 18;
  const borderWidth = isSelected ? 4 : 3;

  // 表示期間外の強制表示マーカーは赤枠で強調
  let borderColor: string;
  let borderStyle = 'solid';
  let glowColor: string;
  let boxShadow: string;

  if (isOutOfRange) {
    borderColor = '#dc2626';
    borderStyle = 'dashed';
    glowColor = 'rgba(220, 38, 38, 0.35)';
    boxShadow = `0 0 0 4px ${glowColor}, 0 4px 12px rgba(0,0,0,0.4)`;
  } else {
    borderColor = statusBorderColor || (isSelected ? '#3b82f6' : 'white');
    glowColor = statusBorderColor
      ? `${statusBorderColor}4D`
      : 'rgba(59, 130, 246, 0.3)';
    boxShadow = isSelected || statusBorderColor
      ? `0 0 0 4px ${glowColor}, 0 4px 12px rgba(0,0,0,0.4)`
      : '0 2px 8px rgba(0,0,0,0.3)';
  }

  const icon = L.divIcon({
    className: 'animal-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transition:all 0.2s ease;">
        <div style="background-color:${config.color};width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;border:${borderWidth}px ${borderStyle} ${borderColor};box-shadow:${boxShadow}">
          ${config.emoji}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });

  iconCache.set(cacheKey, icon);
  return icon;
}
