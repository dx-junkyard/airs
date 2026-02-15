'use client';

import { useState, useMemo, useCallback } from 'react';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import type { EstimatedDisplayDays } from '@/features/report/types/timeline';
import {
  convertReportsToTimelineGeoJSON,
  calculateTimelineRange,
} from '@/features/report/utils/geoJsonConverter';
import { BaseReportMap } from '@/features/map/components/BaseReportMap';
import { ClusterLayer } from '@/features/map/extensions/ClusterLayer';
import { HeatmapLayer } from '@/features/map/extensions/HeatmapLayer';
import TimelineLayer from '@/features/map/extensions/TimelineLayer';
import ReportDateFilterControl from '@/features/map/extensions/ReportDateFilterControl';
import SharedFacilityLayer from '@/features/map/extensions/SharedFacilityLayer';
import { ANIMAL_MARKER_CONFIG } from '@/features/report/constants/animalMarkerConfig';
import type { AnimalTypeConfig } from '@/server/domain/constants/animalTypes';

export type InteractionMode = 'popup' | 'none';
export type MapMode = 'default' | 'timeline';

interface FullscreenReportMapProps {
  /** 表示する通報リスト */
  reports: ReportDto[];
  /** URLから復元する初期中心位置 */
  initialCenter?: { lat: number; lng: number };
  /** URLから復元する初期ズームレベル */
  initialZoom?: number;
  /** 地図の状態変更時のコールバック */
  onMapStateChange?: (
    center: { lat: number; lng: number },
    zoom: number
  ) => void;
  /** パネルが開いているかどうか（左マージン調整用） */
  isPanelOpen?: boolean;
  /** 地図の高さ（埋め込みモード時） */
  height?: string;
  /** インタラクションモード: popup（ポップアップ）/ click（クリックイベント）/ none（インタラクション無効） */
  interactionMode?: InteractionMode;
  /** マーカークリック時のコールバック（interactionMode='click'時のみ有効） */
  onMarkerClick?: (report: ReportDto) => void;
  /** 選択された通報（ハイライト表示用） */
  selectedReport?: ReportDto | null;
  /** フォーカスする通報（この通報の位置を中心に表示） */
  focusedReport?: ReportDto | null;
  /** （廃止）`mode` は廃止済み。埋め込み判定は `isIframe` を使用してください。 */
  /** 地図モード: default（通常）/ timeline（タイムライン） */
  mapMode?: MapMode;
  /** タイムライン表示時の推定表示日数 */
  estimatedDisplayDays?: EstimatedDisplayDays;
  /** フルスクリーンコントロールを表示するか */
  showFullscreenControl?: boolean;
  /** 凡例を表示するか */
  showLegend?: boolean;
  /** iframe内で表示するか（X-Frame-Options対策） */
  isIframe?: boolean;
  /** UIオーバーレイ（パネル、カウンターなど）をフルスクリーン内に含める */
  uiOverlay?: React.ReactNode;
  /** データパネルの高さ（px） — マップのセンタリングで考慮する */
  bottomOffsetPx?: number;
  /** サイドパネル幅（px） — タイムラインやセンタリングで考慮する */
  panelOffsetPx?: number;
  /** 可視化レイヤーの表示制御 */
  showClusterLayer?: boolean;
  showHeatmapLayer?: boolean;
  /** 外部から境界調整を強制するためのインクリメントキー */
  fitBoundsTrigger?: number;
  /** 日付フィルターコントロールを表示するか */
  showSearchControl?: boolean;
  /** 日付フィルター開始日（YYYY-MM-DD） */
  dateFilterStart?: string;
  /** 日付フィルター終了日（YYYY-MM-DD） */
  dateFilterEnd?: string;
  /** 日付フィルター適用時コールバック */
  onDateFilterApply?: (startDate: string, endDate: string) => void;
  /** システム設定で有効にされた獣種一覧（凡例フィルタ用） */
  enabledAnimalTypes?: AnimalTypeConfig[];
  /** MapContainer の whenCreated コールバックを受け取る（親が map を取得するため） */
  onMapCreated?: (map: import('leaflet').Map) => void;
  /** 管理者モードか */
  isAdmin?: boolean;
  /** ハイライト対象の通報ID（指定時、対象以外のマーカーを薄く表示） */
  highlightedReportId?: string;
  /** 地図内に追加描画するReact要素（Polyline等） */
  mapChildren?: React.ReactNode;
  /** クラスタリングを無効化するか */
  disableClustering?: boolean;
  /** マーカー枠線にステータス色を使用するか */
  showStatusBorder?: boolean;
  /** タイムライン自動再生フラグ（AIチャットから期間が指定された場合） */
  autoPlay?: boolean;
  /** 自動再生フラグが消費された後のコールバック */
  onAutoPlayConsumed?: () => void;
  /** 施設レイヤーの職員フィルター用staffIdセット */
  displayStaffIds?: Set<string> | null;
}

/**
 * 統合地図コンポーネント（リファクタリング版）
 *
 * BaseReportMapに拡張機能を組み合わせて使用する。
 * フルスクリーン、埋め込み、タイムライン、クリックイベントなど全ての地図機能を統合。
 */
const FullscreenReportMap = ({
  reports,
  initialCenter,
  initialZoom,
  onMapStateChange,
  isPanelOpen = false,
  height = '100%',
  interactionMode = 'popup',
  onMarkerClick,
  selectedReport,
  focusedReport,
  // `mode` prop は廃止。埋め込み判定は `isIframe` を使用。
  mapMode = 'default',
  estimatedDisplayDays = 7,
  showFullscreenControl = true,
  showLegend = false,
  isIframe = false,
  uiOverlay,
  bottomOffsetPx = 0,
  panelOffsetPx,
  showClusterLayer = true,
  showHeatmapLayer = true,
  showSearchControl = true,
  dateFilterStart = '',
  dateFilterEnd = '',
  onDateFilterApply,
  enabledAnimalTypes,
  fitBoundsTrigger,
  onMapCreated,
  isAdmin = false,
  highlightedReportId,
  mapChildren,
  disableClustering = false,
  showStatusBorder = false,
  autoPlay = false,
  onAutoPlayConsumed,
  displayStaffIds,
}: FullscreenReportMapProps) => {
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [currentDisplayDays, setCurrentDisplayDays] =
    useState<EstimatedDisplayDays>(estimatedDisplayDays);

  const validReports = useMemo(
    () =>
      reports.filter(
        (report) => report.latitude !== 0 || report.longitude !== 0
      ),
    [reports]
  );

  // タイムラインモード用のGeoJSON生成
  const geojson = useMemo(() => {
    if (mapMode !== 'timeline') return null;
    return convertReportsToTimelineGeoJSON(validReports, currentDisplayDays);
  }, [mapMode, validReports, currentDisplayDays]);

  // タイムライン範囲を計算
  const timelineRange = useMemo(() => {
    if (mapMode !== 'timeline') return null;
    return calculateTimelineRange(validReports, currentDisplayDays);
  }, [mapMode, validReports, currentDisplayDays]);

  // 時刻変更ハンドラ
  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // マーカークリックハンドラ（タイムライン用）
  const handleTimelineMarkerClick = useCallback(
    (featureId: string) => {
      if (onMarkerClick) {
        const report = reports.find((r) => r.id === featureId);
        if (report) {
          onMarkerClick(report);
        }
      }
    },
    [reports, onMarkerClick]
  );

  // コンテナのスタイル設定
  // embed モードは親要素に従う、それ以外はパネルの開閉に応じてマージンを調整
  // 埋め込み（iframe）時は親コンテナの高さに従う
  // determine effective panel offset (allow caller to pass dynamic width)
  const effectivePanelOffsetPx =
    typeof panelOffsetPx === 'number' ? panelOffsetPx : isPanelOpen ? 288 : 0;

  const containerStyle = isIframe
    ? { height }
    : { marginRight: `${effectivePanelOffsetPx}px` };
  const containerClass = isIframe
    ? 'relative size-full'
    : 'relative size-full transition-all duration-300';

  return (
    <div className={containerClass} style={containerStyle}>
      {/* 凡例（右上） */}
      {showLegend && (
        <div
          className={`
            absolute top-4 right-4 z-50 rounded-md bg-white/90 p-2 text-sm
            shadow-md
          `}
        >
          <div className="mb-1 font-medium">凡例</div>
          <ul className="space-y-1">
            {(enabledAnimalTypes
              ? enabledAnimalTypes
                  .filter((t) => t.id in ANIMAL_MARKER_CONFIG)
                  .map((t) => [t.id, ANIMAL_MARKER_CONFIG[t.id]] as const)
              : Object.entries(ANIMAL_MARKER_CONFIG)
            ).map(([key, cfg]) => (
              <li key={key} className="flex items-center gap-2">
                <span className="text-lg">{cfg.emoji}</span>
                <span className="text-solid-gray-700">{cfg.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <BaseReportMap
        reports={validReports}
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        onMapStateChange={onMapStateChange}
        onMapCreated={onMapCreated}
        height={height}
        interactionMode="none" // 拡張レイヤーで制御するためnoneに
        onMarkerClick={onMarkerClick}
        selectedReport={selectedReport}
        focusedReport={focusedReport}
        panelOffsetPx={effectivePanelOffsetPx}
        bottomOffsetPx={bottomOffsetPx ?? 0}
        showFullscreenControl={showFullscreenControl}
        isIframe={isIframe}
        isAdmin={isAdmin}
        skipBoundsUpdate={!!(initialCenter && initialZoom)}
        fitBoundsTrigger={fitBoundsTrigger}
        uiOverlay={uiOverlay}
      >
        {/* 日付フィルターコントロール */}
        {showSearchControl && onDateFilterApply && (
          <ReportDateFilterControl
            key={`${dateFilterStart}-${dateFilterEnd}`}
            startDate={dateFilterStart}
            endDate={dateFilterEnd}
            onApplyDateRange={onDateFilterApply}
          />
        )}

        {/* タイムライン情報表示（削除済） */}

        {/* タイムライン時は geojson と currentTime に基づいてフィルタする */}
        {mapMode === 'timeline' && geojson && currentTime !== null ? (
          (() => {
            const visibleIds = new Set<string>();
            geojson.features.forEach((f) => {
              const start = new Date(f.properties.start as string).getTime();
              const end = new Date(f.properties.end as string).getTime();
              if (currentTime! >= start && currentTime! <= end) {
                visibleIds.add(f.properties.id as string);
              }
            });

            // selectedReport が表示期間外の場合も強制的に含める
            const outOfRangeReportIds = new Set<string>();
            let filtered = validReports.filter((r) => visibleIds.has(r.id));
            if (
              selectedReport &&
              !visibleIds.has(selectedReport.id) &&
              validReports.some((r) => r.id === selectedReport.id)
            ) {
              filtered = [
                ...filtered,
                validReports.find((r) => r.id === selectedReport.id)!,
              ];
              outOfRangeReportIds.add(selectedReport.id);
            }

            return (
              <>
                {showClusterLayer && (
                  <ClusterLayer
                    reports={filtered}
                    onMarkerClick={onMarkerClick}
                    showPopup={interactionMode === 'popup'}
                    isIframe={isIframe}
                    isAdmin={isAdmin}
                    selectedReport={selectedReport}
                    currentTime={currentTime}
                    displayDays={currentDisplayDays}
                    highlightedReportId={highlightedReportId}
                    disableClustering={disableClustering}
                    showStatusBorder={showStatusBorder}
                    outOfRangeReportIds={outOfRangeReportIds}
                  />
                )}
                {showHeatmapLayer && <HeatmapLayer reports={filtered} />}
              </>
            );
          })()
        ) : (
          <>
            {/* 通常表示 */}
            {showClusterLayer && (
              <ClusterLayer
                reports={validReports}
                onMarkerClick={onMarkerClick}
                showPopup={interactionMode === 'popup'}
                isIframe={isIframe}
                isAdmin={isAdmin}
                selectedReport={selectedReport}
                highlightedReportId={highlightedReportId}
                disableClustering={disableClustering}
                showStatusBorder={showStatusBorder}
              />
            )}
            {showHeatmapLayer && <HeatmapLayer reports={validReports} />}
          </>
        )}

        {/* タイムラインUIオーバーレイ */}
        {mapMode === 'timeline' && geojson && (
          <TimelineLayer
            geojson={geojson}
            displayDays={currentDisplayDays}
            onDisplayDaysChange={setCurrentDisplayDays}
            onTimeChange={handleTimeChange}
            panelOffsetPx={effectivePanelOffsetPx}
            autoPlay={autoPlay}
            onAutoPlayConsumed={onAutoPlayConsumed}
          />
        )}

        {/* 施設レイヤー */}
        <SharedFacilityLayer displayStaffIds={displayStaffIds} />

        {/* 外部から注入する追加レイヤー */}
        {mapChildren}
      </BaseReportMap>
    </div>
  );
};

export default FullscreenReportMap;
