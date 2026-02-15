'use client';

import { useEffect, useMemo } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAtomValue } from 'jotai';
import { sharedFacilitiesAtom } from '@/features/facility/atoms/sharedFacilitiesAtom';
import { sharedFacilityLayerVisibleAtom } from '@/features/map/atoms/facilityLayerVisibilityAtom';
import {
  getFacilityCategoryEmoji,
  getFacilityCategoryLabel,
} from '@/server/domain/constants/facilityCategories';

/**
 * カテゴリ別の施設アイコンを動的生成
 */
const createFacilityIcon = (emoji: string): L.DivIcon =>
  L.divIcon({
    className: 'shared-facility-pin',
    html: `<div style="
      width: 26px;
      height: 26px;
      background-color: #7c3aed;
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
    ">${emoji}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });

/** アイコンキャッシュ */
const iconCache = new Map<string, L.DivIcon>();

const getCachedIcon = (emoji: string): L.DivIcon => {
  let icon = iconCache.get(emoji);
  if (!icon) {
    icon = createFacilityIcon(emoji);
    iconCache.set(emoji, icon);
  }
  return icon;
};

interface SharedFacilityLayerProps {
  /**
   * 表示対象の職員IDセット
   * - undefined → 全施設表示（EditableLocationMap等、既存動作維持）
   * - null → 全施設表示（職員フィルター「全表示」）
   * - Set → isShared=true は常に表示、isShared=false は staffId が Set に含まれる場合のみ
   */
  displayStaffIds?: Set<string> | null;
}

/**
 * 施設レイヤー
 *
 * sharedFacilitiesAtom からデータを取得し、地図上にマーカーを表示する。
 * displayStaffIds が指定された場合、職員フィルターと連動してフィルタリングする。
 * ホバーでポップアップ表示（ClusterLayerと同パターン）。
 */
const SharedFacilityLayer = ({ displayStaffIds }: SharedFacilityLayerProps) => {
  const allFacilities = useAtomValue(sharedFacilitiesAtom);
  const isVisible = useAtomValue(sharedFacilityLayerVisibleAtom);
  const map = useMap();

  const facilities = useMemo(() => {
    if (displayStaffIds == null) return allFacilities;
    return allFacilities.filter(
      (f) => f.isShared || displayStaffIds.has(f.staffId)
    );
  }, [allFacilities, displayStaffIds]);

  // ポップアップDOM にマウスリスナーを付与（ポップアップ上のホバー持続）
  useEffect(() => {
    const handlePopupOpen = (e: L.PopupEvent) => {
      const el = e.popup.getElement();
      const source = (e.popup as any)._source as L.Marker | undefined;
      if (!el || !source) return;

      const onLeave = () => {
        source.closePopup();
      };

      el.addEventListener('mouseleave', onLeave);

      const handleClose = () => {
        el.removeEventListener('mouseleave', onLeave);
        map.off('popupclose', handleClose);
      };
      map.on('popupclose', handleClose);
    };

    map.on('popupopen', handlePopupOpen);
    return () => {
      map.off('popupopen', handlePopupOpen);
    };
  }, [map]);

  if (!isVisible || facilities.length === 0) return null;

  return (
    <>
      {facilities.map((facility) => {
        const emoji = getFacilityCategoryEmoji(facility.category);
        const icon = getCachedIcon(emoji);

        return (
          <Marker
            key={facility.id}
            position={[facility.latitude, facility.longitude]}
            icon={icon}
            eventHandlers={{
              mouseover: (e: any) => {
                e.target.openPopup();
              },
              mouseout: (e: any) => {
                const relatedTarget = e.originalEvent
                  ?.relatedTarget as HTMLElement | null;
                const popup = e.target.getPopup();
                const popupEl = popup?.getElement();
                if (
                  popupEl &&
                  relatedTarget &&
                  popupEl.contains(relatedTarget)
                )
                  return;
                e.target.closePopup();
              },
            }}
          >
            <Popup>
              <div className="min-w-[160px]">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <span className="font-bold">{facility.name}</span>
                </div>
                <p className="text-xs text-solid-gray-500">
                  {getFacilityCategoryLabel(facility.category)}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default SharedFacilityLayer;
