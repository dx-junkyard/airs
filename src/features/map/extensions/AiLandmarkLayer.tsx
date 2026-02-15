'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAtomValue } from 'jotai';
import { aiLandmarkResultsAtom } from '@/features/analysis/atoms/analysisAtoms';
import { aiLandmarkLayerVisibleAtom } from '@/features/map/atoms/facilityLayerVisibilityAtom';

/**
 * AI検索結果マーカー用のdivIconを生成
 */
const createAiLandmarkIcon = (emoji: string): L.DivIcon =>
  L.divIcon({
    className: 'ai-landmark-pin',
    html: `<div style="
      width: 28px;
      height: 28px;
      background-color: #805ad5;
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
const aiIconCache = new Map<string, L.DivIcon>();

const getCachedAiIcon = (emoji: string): L.DivIcon => {
  let icon = aiIconCache.get(emoji);
  if (!icon) {
    icon = createAiLandmarkIcon(emoji);
    aiIconCache.set(emoji, icon);
  }
  return icon;
};

/**
 * AIチャットのsearchLandmarks結果を地図上に絵文字マーカーとして描画するコンポーネント
 *
 * AiSelectedPointTrackerと同じパターン（Leaflet API直接操作、Reactレンダリングなし）で実装。
 * aiLandmarkResultsAtomの変更を監視し、ランドマークマーカーの追加/削除を行う。
 */
export default function AiLandmarkLayer() {
  const map = useMap();
  const landmarks = useAtomValue(aiLandmarkResultsAtom);
  const isVisible = useAtomValue(aiLandmarkLayerVisibleAtom);

  useEffect(() => {
    if (!isVisible || landmarks.length === 0) return;

    const layerGroup = L.layerGroup();

    for (const landmark of landmarks) {
      const lat = Number(landmark.latitude);
      const lng = Number(landmark.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

      const emoji = landmark.emoji || '📍';
      const icon = getCachedAiIcon(emoji);

      const marker = L.marker([lat, lng], { icon, pane: 'markerPane' });

      const distanceText =
        landmark.distance >= 1000
          ? `${(landmark.distance / 1000).toFixed(1)}km`
          : `${Math.round(landmark.distance)}m`;

      marker.bindPopup(
        `<div style="min-width:160px">` +
          `<div style="display:inline-block;font-size:10px;color:#805ad5;border:1px solid #805ad5;border-radius:4px;padding:0 4px;margin-bottom:4px;line-height:1.6">AI検索結果</div>` +
          `<div style="font-weight:bold;margin-bottom:2px">${emoji} ${landmark.name}</div>` +
          `<div style="font-size:12px;color:#666">${landmark.category} ・ ${distanceText}</div>` +
          `<div style="font-size:10px;color:#999;margin-top:6px;border-top:1px dashed #ddd;padding-top:4px">ページ更新で消去されます</div>` +
        `</div>`
      );

      marker.on('mouseover', () => marker.openPopup());

      layerGroup.addLayer(marker);
    }

    layerGroup.addTo(map);

    return () => {
      try {
        layerGroup.remove();
      } catch (e) {
        // ignore
      }
    };
  }, [map, landmarks, isVisible]);

  return null;
}
