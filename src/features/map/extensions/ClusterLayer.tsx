'use client';

import {
  useMemo,
  useCallback,
  useTransition,
  useEffect,
  useRef,
  useState,
  memo,
} from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import { ANIMAL_MARKER_CONFIG } from '@/features/report/constants/animalMarkerConfig';
import { createClusterIcon } from '@/features/report/utils/clusterIconUtils';
import {
  createAnimalIcon,
  STATUS_BORDER_COLORS,
} from '@/features/map/utils/markerUtils';
import {
  getReportStatusLabel,
  type ReportStatusValue,
} from '@/server/domain/constants/reportStatuses';
import { useQueryClient } from '@tanstack/react-query';
import { updateReport } from '@/features/report/actions';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import { formatReportDateTime } from '@/features/common/utils/dateFormatter';

export interface ClusterLayerProps {
  /** 表示する通報リスト */
  reports: ReportDto[];
  /** マーカークリック時のコールバック */
  onMarkerClick?: (report: ReportDto) => void;
  /** ポップアップを表示するか */
  showPopup?: boolean;
  /** iframe内で表示するか（詳細リンクの表示制御） */
  isIframe?: boolean;
  /** 管理者モードか（詳細リンク・ステータスボタンの表示制御） */
  isAdmin?: boolean;
  /** マーカーの不透明度（0-1） */
  opacity?: number;
  /** 選択された通報（強調表示用） */
  selectedReport?: ReportDto | null;
  /** 現在時刻（タイムライン表示用、フェードアウト計算に使用） */
  currentTime?: number | null;
  /** 表示日数（タイムライン表示用、フェードアウト計算に使用） */
  displayDays?: number;
  /** ハイライト対象の通報ID（指定時、対象以外のマーカーを薄く表示） */
  highlightedReportId?: string;
  /** クラスタリングを無効化するか */
  disableClustering?: boolean;
  /** マーカー枠線にステータス色を使用するか */
  showStatusBorder?: boolean;
  /** タイムライン表示期間外だが強制表示されている通報IDのセット */
  outOfRangeReportIds?: Set<string>;
}

/** ステータス変更ボタン（ポップアップ内） */
function StatusChangeButtons({
  reportId,
  status,
}: {
  reportId: string;
  status: ReportStatusValue;
}) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(status);
  const queryClient = useQueryClient();

  const handleStatusChange = useCallback(
    (newStatus: ReportStatusValue) => {
      startTransition(async () => {
        const formData = new FormData();
        formData.set('status', newStatus);
        await updateReport(reportId, formData);
        setLocalStatus(newStatus);
        queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      });
    },
    [reportId, queryClient]
  );

  if (localStatus === 'waiting') {
    return (
      <button
        onClick={() => handleStatusChange('completed')}
        disabled={isPending}
        className={`
          mt-2 block w-full rounded bg-blue-600 px-3 py-1.5 text-center text-xs
          font-medium text-white transition-colors
          hover:bg-blue-700
          disabled:opacity-50
        `}
      >
        {isPending ? '更新中...' : '確認完了にする'}
      </button>
    );
  }

  return null;
}

/**
 * マーカークラスタリング拡張レイヤー
 *
 * react-leaflet-clusterを使用して、多数のマーカーを効率的に表示する。
 * 閲覧モードでも編集モード（参照用）でも使用可能。
 * React.memoで不要な再レンダリングを防止。
 */
export const ClusterLayer = memo(({
  reports,
  onMarkerClick,
  showPopup = true,
  isIframe = false,
  isAdmin = false,
  opacity = 1.0,
  selectedReport,
  currentTime,
  displayDays,
  highlightedReportId,
  disableClustering = false,
  showStatusBorder = false,
  outOfRangeReportIds,
}: ClusterLayerProps) => {
  const map = useMap();
  const clusterIconFunction = useMemo(() => createClusterIcon, []);
  const selectedReportIdRef = useRef(selectedReport?.id);

  // selectedReport の最新値を ref に同期（イベントハンドラ内で参照するため）
  useEffect(() => {
    selectedReportIdRef.current = selectedReport?.id;
  }, [selectedReport?.id]);

  // ポップアップDOM にマウスリスナーを付与（ポップアップ上のホバー持続）
  useEffect(() => {
    if (!showPopup) return;

    const handlePopupOpen = (e: L.PopupEvent) => {
      const el = e.popup.getElement();
      const source = (e.popup as any)._source as L.Marker | undefined;
      if (!el || !source) return;

      const markerId = (source.options as any).alt as string | undefined;

      const onLeave = () => {
        // クリック固定中は閉じない
        if (markerId && selectedReportIdRef.current === markerId) return;
        source.closePopup();
      };

      el.addEventListener('mouseleave', onLeave);

      // ポップアップ閉じ時にリスナーを解除
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
  }, [map, showPopup]);

  // タイムライン表示時の不透明度計算関数
  const getOpacity = (report: ReportDto) => {
    // 基本の不透明度
    let baseOpacity = opacity;

    if (currentTime && displayDays) {
      const reportTime = new Date(report.createdAt).getTime();
      const diff = currentTime - reportTime;

      if (diff >= 0) {
        const duration = displayDays * 24 * 60 * 60 * 1000;
        // 経過時間の割合（0: 直後 -> 1: 期限切れ直前）
        const ratio = diff / duration;

        // 1.0 -> 0.3 に線形補間（古くなるほど薄くなる）
        // 最小値は 0.3 とし、完全に消えないようにする
        const calculatedOpacity = Math.max(0.3, 1.0 - ratio * 0.7);

        // 全体のopacity設定も考慮
        baseOpacity = calculatedOpacity * opacity;
      }
    }

    return baseOpacity;
  };

  return (
    <MarkerClusterGroup
      key={disableClustering ? 'no-cluster' : 'cluster'}
      chunkedLoading
      maxClusterRadius={60}
      spiderfyOnMaxZoom={false}
      showCoverageOnHover={false}
      zoomToBoundsOnClick
      animate={true}
      disableClusteringAtZoom={disableClustering ? 0 : 18}
      iconCreateFunction={clusterIconFunction}
    >
      {reports.map((report) => {
        const isSelected = selectedReport?.id === report.id;
        const isOutOfRange = outOfRangeReportIds?.has(report.id) ?? false;
        const markerOpacity = getOpacity(report);

        return (
          <Marker
            key={`${report.id}-${report.createdAt}`}
            alt={report.id}
            position={[report.latitude, report.longitude]}
            icon={createAnimalIcon(
              report.animalType,
              isSelected,
              showStatusBorder
                ? STATUS_BORDER_COLORS[report.status]
                : undefined,
              isOutOfRange
            )}
            opacity={markerOpacity}
            eventHandlers={{
              ...(onMarkerClick
                ? {
                    click: (e: any) => {
                      onMarkerClick(report);
                      // Leaflet の bindPopup は click 時に togglePopup() を呼び、
                      // ホバーで既に開いているポップアップを閉じてしまう。
                      // microtask で描画前にポップアップを再オープンし、ちらつきを防止する。
                      queueMicrotask(() => {
                        if (!e.target.isPopupOpen()) {
                          e.target.openPopup();
                        }
                      });
                    },
                  }
                : {}),
              ...(showPopup
                ? {
                      mouseover: (e: any) => {
                        e.target.openPopup();
                      },
                      mouseout: (e: any) => {
                        // クリック固定中は閉じない
                        if (selectedReportIdRef.current === report.id) return;
                        // カーソルがポップアップに移動した場合は閉じない
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
                    }
                  : {}),
            }}
          >
            {showPopup && (
              <Popup maxWidth={500}>
                <div className="min-w-[320px]">
                  <div
                    className="grid grid-cols-[2fr_3fr] gap-3"
                  >
                    {report.images.length > 0 ? (
                      <div className="relative overflow-hidden rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={report.images[report.images.length - 1].url}
                          alt=""
                          className="absolute inset-0 size-full object-cover"
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
                          {ANIMAL_MARKER_CONFIG[report.animalType]?.emoji ||
                            ANIMAL_MARKER_CONFIG.other.emoji}
                        </span>
                        <span className="font-bold">
                          {ANIMAL_MARKER_CONFIG[report.animalType]?.label ||
                            ANIMAL_MARKER_CONFIG.other.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-solid-gray-600">
                        {report.address}
                      </p>
                      <p className="mt-0.5 text-xs text-solid-gray-500">
                        {formatReportDateTime(report.createdAt, report.hasOnlyDate)}
                      </p>
                      <p className="mt-0.5 text-xs">
                        ステータス: {getReportStatusLabel(report.status)}
                      </p>
                    </div>
                  </div>
                  {report.description && (
                    <p
                      className={`
                        mt-2 line-clamp-6 border-t border-solid-gray-200 pt-2
                        text-sm whitespace-pre-line
                      `}
                    >
                      {report.description}
                    </p>
                  )}
                  {isAdmin && !isIframe && (
                    <>
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
                      <StatusChangeButtons
                        reportId={report.id}
                        status={report.status as ReportStatusValue}
                      />
                    </>
                  )}
                </div>
              </Popup>
            )}
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
}, (prevProps, nextProps) => {
  // カスタム比較関数: 実際に描画に影響するpropsのみ比較
  if (prevProps.reports !== nextProps.reports) return false;
  if (prevProps.opacity !== nextProps.opacity) return false;
  if (prevProps.selectedReport?.id !== nextProps.selectedReport?.id) return false;
  if (prevProps.currentTime !== nextProps.currentTime) return false;
  if (prevProps.displayDays !== nextProps.displayDays) return false;
  if (prevProps.highlightedReportId !== nextProps.highlightedReportId) return false;
  if (prevProps.disableClustering !== nextProps.disableClustering) return false;
  if (prevProps.showStatusBorder !== nextProps.showStatusBorder) return false;
  if (prevProps.showPopup !== nextProps.showPopup) return false;
  if (prevProps.isIframe !== nextProps.isIframe) return false;
  if (prevProps.isAdmin !== nextProps.isAdmin) return false;
  // outOfRangeReportIds は Set なので参照比較ではなく中身を比較する
  const prevOutOfRange = prevProps.outOfRangeReportIds;
  const nextOutOfRange = nextProps.outOfRangeReportIds;
  if (prevOutOfRange !== nextOutOfRange) {
    if (!prevOutOfRange || !nextOutOfRange) return false;
    if (prevOutOfRange.size !== nextOutOfRange.size) return false;
    for (const id of prevOutOfRange) {
      if (!nextOutOfRange.has(id)) return false;
    }
  }
  return true;
});

ClusterLayer.displayName = 'ClusterLayer';

export default ClusterLayer;
