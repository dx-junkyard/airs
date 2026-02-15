'use client';

import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import L from 'leaflet';
import { useSetAtom, useAtomValue } from 'jotai';
import AiLandmarkLayer from '@/features/map/extensions/AiLandmarkLayer';
import AiSelectedPointTracker from '@/features/map/extensions/AiSelectedPointTracker';
import { mapBoundsAtom } from '@/features/map/atoms/mapBoundsAtom';
import { currentBaseMapAtom } from '@/features/map/atoms/baseMapAtom';
import BaseMapSelector from '@/features/map/components/BaseMapSelector';
import 'leaflet/dist/leaflet.css';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import { ANIMAL_MARKER_CONFIG } from '@/features/report/constants/animalMarkerConfig';
import { createAnimalIcon } from '@/features/map/utils/markerUtils';
import {
  MAP_MAX_ZOOM,
  MAP_JAPAN_OVERVIEW_ZOOM,
  MAP_DEFAULT_CENTER,
} from '@/constants/map';
import { formatReportDateTime } from '@/features/common/utils/dateFormatter';
import { getReportStatusLabel } from '@/server/domain/constants/reportStatuses';
import { MapFullscreenControl } from '@/features/map/extensions/MapFullscreenControl';

/**
 * 獣種別のカスタムマーカーアイコンを生成
 */
// `createAnimalIcon` moved to `features/map/utils/markerUtils.ts`

/**
 * マウント時に親へ map インスタンスを通知するヘルパー
 */
function MapCreatedNotifier({
  onMapCreated,
}: {
  onMapCreated: (map: L.Map) => void;
}) {
  const map = useMap();
  useEffect(() => {
    onMapCreated(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/**
 * レポートに基づいて地図の境界を自動調整するコンポーネント
 */
function MapBoundsUpdater({
  reports,
  skip = false,
  panelOffsetPx = 0,
  bottomOffsetPx = 0,
  fitTrigger,
}: {
  reports: ReportDto[];
  skip?: boolean;
  panelOffsetPx?: number;
  bottomOffsetPx?: number;
  fitTrigger?: number;
}) {
  const map = useMap();
  const lastAppliedTriggerRef = useRef<number | undefined>(undefined);
  // トリガーが変わらなくてもパネル幅が変わった場合に再計算するための参照
  const lastPanelOffsetRef = useRef<number | undefined>(undefined);
  const lastBottomOffsetRef = useRef<number | undefined>(undefined);
  // 明示トリガーなしモードでは、初回のみ自動fitする
  const hasAppliedInitialFitRef = useRef(false);
  // 初回マウント時かどうか（URLパラメータで位置指定されている場合は初回fitBoundsをスキップ）
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    if (reports.length === 0) return;

    // If an explicit trigger is provided, use it to fit bounds
    if (typeof fitTrigger !== 'undefined') {
      // トリガーが変わったか、パネル幅が変わった場合に実行
      // ただし、トリガーが同じでパネル幅が変わった場合は、トリガーが最後に更新された後の変更とみなし追従する
      const triggerChanged = lastAppliedTriggerRef.current !== fitTrigger;
      const panelChanged = lastPanelOffsetRef.current !== panelOffsetPx;
      const bottomChanged = lastBottomOffsetRef.current !== bottomOffsetPx;

      if (!triggerChanged && !panelChanged && !bottomChanged) return;

      // 初回マウント時かつskip=trueの場合は、fitBoundsをスキップ（URLパラメータで位置指定時）
      if (isInitialMountRef.current && skip) {
        isInitialMountRef.current = false;
        lastAppliedTriggerRef.current = fitTrigger;
        lastPanelOffsetRef.current = panelOffsetPx;
        lastBottomOffsetRef.current = bottomOffsetPx;
        return;
      }
      isInitialMountRef.current = false;

      lastAppliedTriggerRef.current = fitTrigger;
      lastPanelOffsetRef.current = panelOffsetPx;
      lastBottomOffsetRef.current = bottomOffsetPx;

      const bounds = L.latLngBounds(
        reports.map((r) => [r.latitude, r.longitude] as [number, number])
      );

      // パネル（右側）とデータパネル（下側）を考慮したパディング設定
      const margin = 50;
      const paddingRight = Math.max(margin, (panelOffsetPx || 0) + margin);
      const paddingBottom = Math.max(margin, (bottomOffsetPx || 0) + margin);

      map.fitBounds(bounds, {
        paddingTopLeft: [margin, margin],
        paddingBottomRight: [paddingRight, paddingBottom],
        maxZoom: 15,
      });
      return;
    }

    // 明示トリガーがない場合は、初回ロード時のみfitBoundsする
    if (hasAppliedInitialFitRef.current || skip) return;

    const bounds = L.latLngBounds(
      reports.map((r) => [r.latitude, r.longitude] as [number, number])
    );

    // パネル（右側）とデータパネル（下側）を考慮したパディング設定
    const margin = 50;
    const paddingRight = Math.max(margin, (panelOffsetPx || 0) + margin);
    const paddingBottom = Math.max(margin, (bottomOffsetPx || 0) + margin);

    map.fitBounds(bounds, {
      paddingTopLeft: [margin, margin],
      paddingBottomRight: [paddingRight, paddingBottom],
      maxZoom: 15,
    });
    hasAppliedInitialFitRef.current = true;
  }, [map, reports, skip, panelOffsetPx, bottomOffsetPx, fitTrigger]);

  return null;
}

/**
 * 地図の状態（中心位置・ズーム）をトラッキングするコンポーネント
 */
function MapStateTracker({
  onMapStateChange,
}: {
  onMapStateChange?: (
    center: { lat: number; lng: number },
    zoom: number
  ) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!onMapStateChange) return;

    const handleMoveEnd = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onMapStateChange({ lat: center.lat, lng: center.lng }, zoom);
    };

    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onMapStateChange]);

  return null;
}

/**
 * 地図の表示範囲（bounds）をJotai atomに同期するコンポーネント
 * moveend/zoomendイベントで更新（150msスロットリングで高頻度更新を抑制）
 */
function MapBoundsTracker() {
  const map = useMap();
  const setMapBounds = useSetAtom(mapBoundsAtom);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const updateBoundsThrottled = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastUpdateRef.current;
    const THROTTLE_MS = 150;

    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }

    if (elapsed >= THROTTLE_MS) {
      // 十分な時間が経過していればすぐ更新
      lastUpdateRef.current = now;
      const bounds = map.getBounds();
      setMapBounds({
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast(),
      });
    } else {
      // まだ間隔が短い場合は残り時間後に更新
      throttleTimerRef.current = setTimeout(() => {
        throttleTimerRef.current = null;
        lastUpdateRef.current = Date.now();
        const bounds = map.getBounds();
        setMapBounds({
          south: bounds.getSouth(),
          west: bounds.getWest(),
          north: bounds.getNorth(),
          east: bounds.getEast(),
        });
      }, THROTTLE_MS - elapsed);
    }
  }, [map, setMapBounds]);

  useEffect(() => {
    // 初回マウント時にも現在の範囲を設定
    const bounds = map.getBounds();
    setMapBounds({
      south: bounds.getSouth(),
      west: bounds.getWest(),
      north: bounds.getNorth(),
      east: bounds.getEast(),
    });
    lastUpdateRef.current = Date.now();

    map.on('moveend', updateBoundsThrottled);
    map.on('zoomend', updateBoundsThrottled);

    return () => {
      map.off('moveend', updateBoundsThrottled);
      map.off('zoomend', updateBoundsThrottled);
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, [map, setMapBounds, updateBoundsThrottled]);

  return null;
}

/**
 * 選択された通報の位置に地図を移動するコンポーネント
 * selectedReportが変更されたときのみ移動
 */
/**
 * 選択された通報の位置に地図を移動するコンポーネント
 * クラスタリングを考慮し、単独表示されるズームレベルまで調整
 */
function SelectedReportTracker({
  selectedReport,
  panelOffsetPx = 0,
  bottomOffsetPx = 0,
}: {
  selectedReport?: ReportDto | null;
  panelOffsetPx?: number;
  bottomOffsetPx?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedReport) return;

    const targetLat = selectedReport.latitude;
    const targetLng = selectedReport.longitude;

    // ClusterLayerはズーム18以上で個別マーカー表示されるため、
    // 確実に単独表示されるようズーム18に設定
    const currentZoom = map.getZoom();
    const targetZoom = Math.max(currentZoom, 18);

    // 右側にサイドパネルがある場合、マーカーが見える領域の中央に来るよう
    // マーカーのコンテナ座標を基にピクセル差分で地図をパンする
    if (
      (panelOffsetPx && panelOffsetPx > 0) ||
      (bottomOffsetPx && bottomOffsetPx > 0)
    ) {
      const size = map.getSize();
      const visibleWidth = size.x - (panelOffsetPx ?? 0);
      const visibleHeight = size.y - (bottomOffsetPx ?? 0);
      const desiredPoint = L.point(visibleWidth / 2, visibleHeight / 2);

      const markerPoint = map.latLngToContainerPoint(
        L.latLng(targetLat, targetLng)
      );

      const currentZoom = map.getZoom();
      if (targetZoom !== currentZoom) {
        // ズームを変更する場合はまずズーム（中心はマーカー）してから差分パンを行う
        map.once('moveend', () => {
          const markerPointAfter = map.latLngToContainerPoint(
            L.latLng(targetLat, targetLng)
          );
          const delta = desiredPoint.subtract(markerPointAfter);
          if (delta.x !== 0 || delta.y !== 0) {
            map.panBy(delta.multiplyBy(-1), { animate: true, duration: 0.5 });
          }
        });
        map.flyTo([targetLat, targetLng], targetZoom, { duration: 0.5 });
      } else {
        const delta = desiredPoint.subtract(markerPoint);
        if (delta.x !== 0 || delta.y !== 0) {
          map.panBy(delta.multiplyBy(-1), { animate: true, duration: 0.5 });
        }
      }
    } else {
      map.flyTo([targetLat, targetLng], targetZoom, { duration: 0.5 });
    }
  }, [map, selectedReport, panelOffsetPx, bottomOffsetPx]);

  return null;
}


/**
 * ウィンドウリサイズイベントを処理するコンポーネント
 */
function ResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const handleResize = () => {
      // mapが存在し、適切に初期化されているかチェック
      if (map && map.getContainer && map.getContainer()) {
        try {
          map.invalidateSize();
        } catch (e) {
          console.warn('Failed to invalidate map size on resize:', e);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    // コンテナ自体のサイズ変化を監視（サイドバー折りたたみ等に対応）
    const container = map?.getContainer?.();
    let resizeObserver: ResizeObserver | undefined;
    if (container) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
    };
  }, [map]);

  return null;
}

/**
 * サイドパネル幅の変更を監視して map.invalidateSize() を呼ぶコンポーネント
 */
function PanelOffsetObserver({ panelOffsetPx }: { panelOffsetPx?: number }) {
  const map = useMap();
  const lastProcessedTsRef = useRef<number | null>(null);
  useEffect(() => {
    if (!map || !map.getContainer || !map.getContainer()) return;

    try {
      // 保持する中心の取得（コンテナ座標）
      const centerLatLng = map.getCenter();
      const centerPointBefore = map.latLngToContainerPoint(centerLatLng);

      // invalidateSize を呼んでから差分を計算してパンする
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (e) {
          console.warn(
            'Failed to invalidate map size on panelOffset change:',
            e
          );
        }

        try {
          const centerPointAfter = map.latLngToContainerPoint(centerLatLng);
          const delta = centerPointAfter.subtract(centerPointBefore);
          if (delta.x !== 0 || delta.y !== 0) {
            map.panBy(delta.multiplyBy(-1), { animate: true, duration: 0.2 });
          }
        } catch (e) {
          // ignore
        }
      }, 50);
    } catch (e) {
      try {
        map.invalidateSize();
      } catch (er) {
        console.warn(
          'Failed to invalidate map size on panelOffset change:',
          er
        );
      }
    }
    // もし map 作成前にパネル幅変更が発生していれば、それを適用する
    try {
      const change = (window as any).__panelWidthChange as
        | { prevWidth: number; newWidth: number; ts: number }
        | undefined;
      if (change && change.ts && lastProcessedTsRef.current !== change.ts) {
        lastProcessedTsRef.current = change.ts;
        // パン量は (new-prev)/2（右パネル想定）
        const pan = (change.newWidth - change.prevWidth) / 2;
        setTimeout(() => {
          try {
            map.invalidateSize();
          } catch (e) {}
          try {
            map.panBy([pan, 0], { animate: true, duration: 0.2 });
          } catch (e) {}
        }, 60);
      }
    } catch (e) {
      // ignore
    }
  }, [map, panelOffsetPx]);

  return null;
}


/**
 * 指定された通報の位置を地図の中央に表示するコンポーネント
 */
function MapCenterUpdater({
  focusedReport,
  panelOffsetPx = 0,
  bottomOffsetPx = 0,
}: {
  focusedReport: ReportDto | null | undefined;
  panelOffsetPx?: number;
  bottomOffsetPx?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!focusedReport) return;

    if (
      (panelOffsetPx && panelOffsetPx > 0) ||
      (bottomOffsetPx && bottomOffsetPx > 0)
    ) {
      const size = map.getSize();
      const visibleWidth = size.x - (panelOffsetPx ?? 0);
      const visibleHeight = size.y - (bottomOffsetPx ?? 0);
      const desiredPoint = L.point(visibleWidth / 2, visibleHeight / 2);
      const markerPoint = map.latLngToContainerPoint(
        L.latLng(focusedReport.latitude, focusedReport.longitude)
      );
      const delta = desiredPoint.subtract(markerPoint);
      if (delta.x !== 0 || delta.y !== 0) {
        map.panBy(delta.multiplyBy(-1), { animate: true, duration: 0.5 });
      }
    } else {
      map.panTo([focusedReport.latitude, focusedReport.longitude], {
        animate: true,
        duration: 0.5,
      });
    }
  }, [map, focusedReport, panelOffsetPx, bottomOffsetPx]);

  return null;
}

export type InteractionMode = 'popup' | 'none';

export interface BaseReportMapProps {
  /** 表示する通報リスト */
  reports: ReportDto[];
  /** 初期中心位置 */
  initialCenter?: { lat: number; lng: number };
  /** 初期ズームレベル */
  initialZoom?: number;
  /** 地図の状態変更時のコールバック */
  onMapStateChange?: (
    center: { lat: number; lng: number },
    zoom: number
  ) => void;
  /** 地図の高さ */
  height?: string;
  /** インタラクションモード */
  interactionMode?: InteractionMode;
  /** マーカークリック時のコールバック */
  onMarkerClick?: (report: ReportDto) => void;
  /** 選択された通報 */
  selectedReport?: ReportDto | null;
  /** フォーカスする通報 */
  focusedReport?: ReportDto | null;
  /** 右側のサイドパネル幅（px）。指定するとパン/センタリングで考慮される */
  panelOffsetPx?: number;
  /** 下部のデータパネル高さ（px）。指定するとパン/センタリングで考慮される */
  bottomOffsetPx?: number;
  /** フルスクリーンコントロールを表示するか */
  showFullscreenControl?: boolean;
  /** iframe内で表示するか */
  isIframe?: boolean;
  /** 管理者モードか（詳細リンク・ステータスボタンの表示制御） */
  isAdmin?: boolean;
  /** 境界の自動調整をスキップするか */
  skipBoundsUpdate?: boolean;
  /** 外部から強制的に境界調整をトリガーするためのインクリメントキー */
  fitBoundsTrigger?: number;
  /** 拡張レイヤー（children） */
  children?: React.ReactNode;
  /** UIオーバーレイ（パネル、カウンターなど） */
  uiOverlay?: React.ReactNode;
  /** MapContainer の whenCreated コールバック（親が map インスタンスを受け取るため） */
  onMapCreated?: (map: L.Map) => void;
}

/**
 * 地図の基本機能を提供するベースコンポーネント
 *
 * 基本的なTileLayer、マーカー表示、インタラクション機能を提供。
 * クラスタリング、ヒートマップ、タイムラインなどの拡張機能はchildrenとして注入する。
 */
export const BaseReportMap = ({
  reports,
  initialCenter,
  initialZoom,
  onMapStateChange,
  onMapCreated,
  height = '100%',
  interactionMode = 'popup',
  onMarkerClick,
  selectedReport,
  focusedReport,
  panelOffsetPx = 0,
  bottomOffsetPx = 0,
  showFullscreenControl = true,
  isIframe = false,
  isAdmin = false,
  skipBoundsUpdate = false,
  fitBoundsTrigger,
  children,
  uiOverlay,
}: BaseReportMapProps) => {
  const baseMap = useAtomValue(currentBaseMapAtom);

  const validReports = reports.filter(
    (report) => report.latitude !== 0 || report.longitude !== 0
  );

  const hasRestoredState = !!(initialCenter && initialZoom);

  const center = initialCenter
    ? ([initialCenter.lat, initialCenter.lng] as [number, number])
    : MAP_DEFAULT_CENTER;

  const zoom = initialZoom ?? MAP_JAPAN_OVERVIEW_ZOOM;

  return (
    <div style={{ height, width: '100%' }}>
      <div className="relative size-full overflow-clip" id="map-fullscreen-container">
        {/* UIオーバーレイ（パネル、カウンターなど） */}
        {uiOverlay}

        {/* ベースマップ切り替えUI（地図コンテナの左下） */}
        <BaseMapSelector bottomOffset={bottomOffsetPx} />

        <MapContainer
          center={center}
          zoom={zoom}
          maxZoom={MAP_MAX_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
          zoomControl={true}
        >
          {onMapCreated && <MapCreatedNotifier onMapCreated={onMapCreated} />}
          <TileLayer
            key={baseMap.id}
            attribution={baseMap.attribution}
            url={baseMap.url}
            maxZoom={MAP_MAX_ZOOM}
          />
          {showFullscreenControl && (
            <MapFullscreenControl containerId="map-fullscreen-container" />
          )}
          <ResizeHandler />
          <PanelOffsetObserver panelOffsetPx={panelOffsetPx} />
          <MapStateTracker onMapStateChange={onMapStateChange} />
          <MapBoundsTracker />

          {/* 子要素として拡張機能を注入（タイムラインや検索など） */}
          {children}

          {/* AI選択ポイントを監視してズーム/マーカー表示 */}
          <AiSelectedPointTracker />

          {/* AIランドマーク検索結果をマーカー表示 */}
          <AiLandmarkLayer />

          {/* 通報データが存在する場合のみ境界調整やマーカー表示を適用 */}
          {validReports.length > 0 ? (
            <>
              <MapBoundsUpdater
                reports={validReports}
                skip={hasRestoredState || skipBoundsUpdate}
                panelOffsetPx={panelOffsetPx}
                bottomOffsetPx={bottomOffsetPx}
                fitTrigger={fitBoundsTrigger}
              />
              <MapCenterUpdater
                focusedReport={focusedReport}
                panelOffsetPx={panelOffsetPx}
                bottomOffsetPx={bottomOffsetPx}
              />
              <SelectedReportTracker
                selectedReport={selectedReport}
                panelOffsetPx={panelOffsetPx}
                bottomOffsetPx={bottomOffsetPx}
              />

              {/* children がない場合のみデフォルトでマーカーを描画 */}
              {!children &&
                validReports.map((report) => {
                  const isSelected = selectedReport?.id === report.id;
                  return (
                    <Marker
                      key={report.id}
                      position={[report.latitude, report.longitude]}
                      icon={createAnimalIcon(report.animalType, isSelected)}
                      eventHandlers={
                        interactionMode !== 'none' && onMarkerClick
                          ? {
                              click: () => onMarkerClick?.(report),
                            }
                          : undefined
                      }
                    >
                      {interactionMode === 'popup' && (
                        <Popup maxWidth={500}>
                          <div className="min-w-[320px]">
                            <div className="grid grid-cols-[2fr_3fr] gap-3">
                              {report.images.length > 0 ? (
                                <div
                                  className={`
                                    relative overflow-hidden rounded-lg
                                  `}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={
                                      report.images[report.images.length - 1]
                                        .url
                                    }
                                    alt=""
                                    className={`
                                      absolute inset-0 size-full object-cover
                                    `}
                                  />
                                </div>
                              ) : (
                                <div
                                  className={`
                                    flex items-center justify-center rounded-lg
                                    bg-solid-gray-50
                                  `}
                                >
                                  <FontAwesomeIcon
                                    icon={faImage}
                                    className="text-xl text-solid-gray-300"
                                  />
                                </div>
                              )}
                              <div className="min-w-0 py-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">
                                    {ANIMAL_MARKER_CONFIG[report.animalType]
                                      ?.emoji ||
                                      ANIMAL_MARKER_CONFIG.other.emoji}
                                  </span>
                                  <span className="font-bold">
                                    {ANIMAL_MARKER_CONFIG[report.animalType]
                                      ?.label ||
                                      ANIMAL_MARKER_CONFIG.other.label}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-solid-gray-600">
                                  {report.address}
                                </p>
                                <p
                                  className={`
                                    mt-0.5 text-xs text-solid-gray-500
                                  `}
                                >
                                  {formatReportDateTime(report.createdAt, report.hasOnlyDate)}
                                </p>
                                <p className="mt-0.5 text-xs">
                                  ステータス:{' '}
                                  {getReportStatusLabel(report.status)}
                                </p>
                              </div>
                            </div>
                            {report.description && (
                              <p
                                className={`
                                  mt-2 line-clamp-6 border-t
                                  border-solid-gray-200 pt-2 text-sm
                                  whitespace-pre-line
                                `}
                              >
                                {report.description}
                              </p>
                            )}
                            {isAdmin && !isIframe && (
                              <a
                                href={`/admin/report/${report.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`
                                  mt-2 block text-center text-sm text-blue-600
                                  hover:underline
                                `}
                              >
                                詳細を見る
                              </a>
                            )}
                          </div>
                        </Popup>
                      )}
                    </Marker>
                  );
                })}
            </>
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
};

export default BaseReportMap;
