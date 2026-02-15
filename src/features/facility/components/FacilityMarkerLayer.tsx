'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { FacilityDto } from '@/server/application/dtos/FacilityDto';
import type { NearbyLandmarkDto } from '@/server/application/dtos/NearbyLandmarkDto';
import {
  getFacilityCategoryEmoji,
  getFacilityCategoryLabel,
  mapOverpassCategoryToKey,
} from '@/server/domain/constants/facilityCategories';

/**
 * カテゴリ別の施設アイコンを動的生成
 */
const createFacilityIcon = (emoji: string, color: string): L.DivIcon =>
  L.divIcon({
    className: 'facility-pin',
    html: `<div style="
      width: 28px;
      height: 28px;
      background-color: ${color};
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    ">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

/** アイコンキャッシュ */
const iconCache = new Map<string, L.DivIcon>();

const getCachedIcon = (emoji: string, color: string): L.DivIcon => {
  const key = `${emoji}-${color}`;
  let icon = iconCache.get(key);
  if (!icon) {
    icon = createFacilityIcon(emoji, color);
    iconCache.set(key, icon);
  }
  return icon;
};

interface FacilityMarkerLayerProps {
  /** Overpass API検索結果 */
  searchResults: NearbyLandmarkDto[];
  /** 登録済み施設（DB） */
  facilities: FacilityDto[];
  /** 施設登録コールバック */
  onRegister: (landmark: NearbyLandmarkDto) => void;
  /** 施設登録解除コールバック */
  onUnregister: (facilityId: string) => void;
  /** 全体共有トグルコールバック */
  onToggleShared: (facilityId: string, isShared: boolean) => void;
  /** 登録中のoverpassId */
  registeringIds: Set<string>;
  /** 登録解除中のfacilityId */
  unregisteringIds: Set<string>;
}

/**
 * 施設管理ページ用マーカーレイヤー
 *
 * 検索結果の未登録施設と登録済み施設をそれぞれ異なるマーカーで表示する。
 * ホバーでポップアップ表示。ポップアップはホバーアウトしても残り続け、
 * 別のマーカーをホバーすると自動で切り替わる（Leaflet の autoClose）。
 */
const FacilityMarkerLayer = ({
  searchResults,
  facilities,
  onRegister,
  onUnregister,
  onToggleShared,
  registeringIds,
  unregisteringIds,
}: FacilityMarkerLayerProps) => {
  // 登録済みoverpassIdのセット
  const registeredOverpassIds = new Set(facilities.map((f) => f.overpassId));

  // 未登録の検索結果
  const unregisteredResults = searchResults.filter(
    (r) => !registeredOverpassIds.has(r.id)
  );

  return (
    <>
      {/* 未登録施設（検索結果から登録済みを除外） */}
      {unregisteredResults.map((landmark) => {
        const categoryKey = mapOverpassCategoryToKey(landmark.category);
        const emoji = getFacilityCategoryEmoji(categoryKey);
        const icon = getCachedIcon(emoji, '#7c3aed');

        return (
          <Marker
            key={`search-${landmark.id}`}
            position={[landmark.latitude, landmark.longitude]}
            icon={icon}
            eventHandlers={{
              mouseover: (e: any) => e.target.openPopup(),
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <span className="font-bold">{landmark.name}</span>
                </div>
                <p className="mb-2 text-xs text-solid-gray-500">
                  {getFacilityCategoryLabel(categoryKey)}
                </p>
                <button
                  onClick={() => onRegister(landmark)}
                  disabled={registeringIds.has(landmark.id)}
                  className={`
                    block w-full rounded bg-green-600 px-3 py-1.5 text-center
                    text-xs font-medium text-white transition-colors
                    hover:bg-green-700
                    disabled:opacity-50
                  `}
                >
                  {registeringIds.has(landmark.id) ? '登録中...' : '登録'}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* 登録済み施設 */}
      {facilities.map((facility) => {
        const emoji = getFacilityCategoryEmoji(facility.category);
        const icon = getCachedIcon(emoji, '#16a34a');

        return (
          <Marker
            key={`facility-${facility.id}`}
            position={[facility.latitude, facility.longitude]}
            icon={icon}
            eventHandlers={{
              mouseover: (e: any) => e.target.openPopup(),
            }}
          >
            <Popup>
              <div className="min-w-[220px]">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <span className="font-bold">{facility.name}</span>
                </div>
                <p className="mb-2 text-xs text-solid-gray-500">
                  {getFacilityCategoryLabel(facility.category)}
                </p>

                {/* 全体共有トグル */}
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-solid-gray-600">全体共有</span>
                  <label className={`
                    relative inline-flex cursor-pointer items-center
                  `}>
                    <input
                      type="checkbox"
                      checked={facility.isShared}
                      onChange={() =>
                        onToggleShared(facility.id, !facility.isShared)
                      }
                      className="peer sr-only"
                    />
                    <div
                      className={`
                        peer h-5 w-9 rounded-full bg-solid-gray-300
                        peer-checked:bg-blue-600
                        after:absolute after:top-[2px] after:left-[2px]
                        after:size-4 after:rounded-full after:bg-white
                        after:transition-all after:content-['']
                        peer-checked:after:translate-x-full
                      `}
                    />
                  </label>
                </div>

                <button
                  onClick={() => onUnregister(facility.id)}
                  disabled={unregisteringIds.has(facility.id)}
                  className={`
                    block w-full rounded bg-red-500 px-3 py-1.5 text-center
                    text-xs font-medium text-white transition-colors
                    hover:bg-red-600
                    disabled:opacity-50
                  `}
                >
                  {unregisteringIds.has(facility.id)
                    ? '解除中...'
                    : '登録解除'}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default FacilityMarkerLayer;
