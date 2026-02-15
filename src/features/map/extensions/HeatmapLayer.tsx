'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import { patchCanvasWillReadFrequently } from '@/features/map/utils/canvasPatch';

// leaflet.heatが使用するCanvas2DコンテキストにwillReadFrequently: trueを設定
// simpleheatがgetImageDataを頻繁に呼び出すため、この設定がないと警告が発生する
// モジュール読み込み時に1回だけパッチを適用（Canvas生成より前に適用する必要がある）
patchCanvasWillReadFrequently();

/** ヒートマップの色グラデーション設定 */
const HEAT_GRADIENT = {
  0.2: '#3B82F6',
  0.4: '#22C55E',
  0.6: '#EAB308',
  0.8: '#F97316',
  1.0: '#EF4444',
};

/**
 * グリッドベースの密度計算と正規化
 */
function calculateNormalizedDensity(
  reports: ReportDto[],
  gridSize: number = 0.002
): [number, number, number][] {
  if (reports.length === 0) return [];

  const gridCounts = new Map<
    string,
    { lat: number; lng: number; count: number }
  >();

  reports.forEach((report) => {
    const gridLat =
      Math.floor(report.latitude / gridSize) * gridSize + gridSize / 2;
    const gridLng =
      Math.floor(report.longitude / gridSize) * gridSize + gridSize / 2;
    const key = `${gridLat.toFixed(4)},${gridLng.toFixed(4)}`;

    const existing = gridCounts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      gridCounts.set(key, { lat: gridLat, lng: gridLng, count: 1 });
    }
  });

  const maxCount = Math.max(
    ...Array.from(gridCounts.values()).map((g) => g.count)
  );

  const heatData: [number, number, number][] = Array.from(
    gridCounts.values()
  ).map((grid) => [grid.lat, grid.lng, grid.count / maxCount]);

  return heatData;
}

export interface HeatmapLayerProps {
  /** 表示する通報リスト */
  reports: ReportDto[];
  /** 半径 */
  radius?: number;
  /** ぼかし */
  blur?: number;
  /** 最小不透明度 */
  minOpacity?: number;
  /** 最大ズームレベル（これを超えるとヒートマップを非表示） */
  maxZoom?: number;
  /** グリッドサイズ */
  gridSize?: number;
}

/**
 * ヒートマップ拡張レイヤー
 *
 * leaflet.heatを使用して通報の密度分布を可視化する。
 * ズームレベルに応じて自動的に表示/非表示を切り替える。
 */
export const HeatmapLayer = ({
  reports,
  radius = 40,
  blur = 25,
  minOpacity = 0.4,
  maxZoom = 18,
  gridSize = 0.002,
}: HeatmapLayerProps) => {
  const map = useMap();

  const heatData = useMemo(
    () => calculateNormalizedDensity(reports, gridSize),
    [reports, gridSize]
  );

  // ヒートマップレイヤーの参照（debounce中のクリーンアップ用）
  const heatLayerRef = useRef<L.Layer | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateVisibilityRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 前回のdebounceタイマーをクリア
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // 前回のレイヤーをクリーンアップ
    const cleanupPrev = () => {
      if (updateVisibilityRef.current) {
        map.off('zoomend', updateVisibilityRef.current);
        updateVisibilityRef.current = null;
      }
      if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
        map.removeLayer(heatLayerRef.current);
      }
      heatLayerRef.current = null;
    };

    if (reports.length === 0) {
      cleanupPrev();
      return;
    }

    // 200msのデバウンスでヒートマップレイヤーの再生成を抑制
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      cleanupPrev();

      const heatLayer = (
        L as typeof L & { heatLayer: typeof L.heatLayer }
      ).heatLayer(heatData, {
        radius,
        blur,
        maxZoom,
        max: 1.0,
        minOpacity,
        gradient: HEAT_GRADIENT,
      });

      heatLayerRef.current = heatLayer;

      const updateVisibility = () => {
        const zoom = map.getZoom();
        if (zoom >= 16) {
          if (map.hasLayer(heatLayer)) {
            map.removeLayer(heatLayer);
          }
        } else {
          if (!map.hasLayer(heatLayer)) {
            map.addLayer(heatLayer);
          }
        }
      };

      updateVisibilityRef.current = updateVisibility;

      // 初回の可視性設定
      updateVisibility();

      // ズーム変更時に可視性を更新
      map.on('zoomend', updateVisibility);
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      cleanupPrev();
    };
  }, [map, heatData, reports.length, radius, blur, maxZoom, minOpacity]);

  return null;
};

export default HeatmapLayer;
