'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import { ANIMAL_MARKER_CONFIG } from '@/features/report/constants/animalMarkerConfig';
import {
  REPORT_STATUS_LABELS,
  type ReportStatusValue,
} from '@/server/domain/constants/reportStatuses';
import { Z_MAP_DATA_PANEL } from '@/constants/z-index';
import { formatReportDateTime } from '@/features/common/utils/dateFormatter';
import { isAdminMode } from '@/config/admin-mode';
import {
  mapBoundsAtom,
  filterByBoundsAtom,
} from '@/features/map/atoms/mapBoundsAtom';

const PAGE_SIZE = 20;

/**
 * Markdown構文を除去してプレーンテキストに変換する
 * テーブルセルでの表示用（truncateと併用するため1行テキストが望ましい）
 */
const stripMarkdown = (text: string): string => {
  return (
    text
      // 見出し（# ～ ######）
      .replace(/^#{1,6}\s+/gm, '')
      // 太字・斜体（**text**, __text__, *text*, _text_）
      .replace(/(\*{1,3}|_{1,3})(.+?)\1/g, '$2')
      // 取り消し線（~~text~~）
      .replace(/~~(.+?)~~/g, '$1')
      // リンク [text](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 画像 ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // インラインコード
      .replace(/`([^`]+)`/g, '$1')
      // リスト記号（-, *, +, 数字.）
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // 水平線
      .replace(/^[-*_]{3,}\s*$/gm, '')
      // 引用（>）
      .replace(/^>\s+/gm, '')
      // 改行を空白に
      .replace(/\n/g, ' ')
      // 連続する空白を1つに
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
};

interface ReportDataPanelProps {
  /** 表示する通報リスト */
  reports: ReportDto[];
  /** 選択中の通報 */
  selectedReport?: ReportDto | null;
  /** 通報選択時のコールバック */
  onReportSelect?: (report: ReportDto) => void;
  /** パネルの初期高さ（px） */
  initialHeight?: number;
  /** 高さ変更時のコールバック */
  onHeightChange?: (height: number) => void;
  /** 閉じるボタンのコールバック */
  onClose?: () => void;
  /** サイドパネル（レイヤー）が開いているか */
  panelOpen?: boolean;
  /** サイドパネルの幅（px） */
  panelWidth?: number;
}

/**
 * 通報データを横長テーブル形式で表示するパネル
 *
 * 機能:
 * - 横スクロール対応のテーブル表示
 * - Sticky header（スクロール時もヘッダーが固定）
 * - 行クリックで通報を選択
 * - 選択された行をハイライト表示
 * - 選択行への自動スクロール
 * - ドラッグでパネルの高さを調整可能
 *
 * @example
 * ```tsx
 * <ReportDataPanel
 *   reports={filteredReports}
 *   selectedReport={selectedReport}
 *   onReportSelect={handleReportSelect}
 *   initialHeight={192}
 *   onHeightChange={(h) => setParams({ dataPanelHeight: h })}
 * />
 * ```
 */
const ReportDataPanel = ({
  reports,
  selectedReport,
  onReportSelect,
  initialHeight = 192,
  onHeightChange,
  onClose,
  panelOpen = false,
  panelWidth = 288,
}: ReportDataPanelProps) => {
  const mapBounds = useAtomValue(mapBoundsAtom);
  const [filterByBounds, setFilterByBounds] = useAtom(filterByBoundsAtom);
  const tableRef = useRef<HTMLTableElement>(null);
  const [height, setHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [manualPage, setManualPage] = useState(1);
  // ページネーションボタン押下時の選択通報IDを記録し、
  // 選択が変わったらmanualPageの優先を解除する
  const [manualPagingForReportId, setManualPagingForReportId] = useState<
    string | null
  >(null);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);
  const activePointerIdRef = useRef<number | null>(null);
  const latestHeightRef = useRef<number>(initialHeight);

  // リサイズ開始
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = height;
    latestHeightRef.current = height;
    activePointerIdRef.current = e.pointerId;
  };

  useEffect(() => {
    latestHeightRef.current = height;
  }, [height]);

  // リサイズ中
  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (
        activePointerIdRef.current !== null &&
        e.pointerId !== activePointerIdRef.current
      ) {
        return;
      }
      e.preventDefault();
      const deltaY = startYRef.current - e.clientY; // 上に動かすとプラス
      const newHeight = Math.max(
        100, // 最小高さ 100px
        Math.min(
          window.innerHeight - 100, // 最大高さ（画面高さ - 100px）
          startHeightRef.current + deltaY
        )
      );
      setHeight(newHeight);
    };

    const finishResize = (pointerId: number) => {
      if (
        activePointerIdRef.current !== null &&
        pointerId !== activePointerIdRef.current
      ) {
        return;
      }
      activePointerIdRef.current = null;
      setIsResizing(false);
      onHeightChange?.(latestHeightRef.current);
    };

    const handlePointerUp = (e: PointerEvent) => {
      finishResize(e.pointerId);
    };

    const handlePointerCancel = (e: PointerEvent) => {
      finishResize(e.pointerId);
    };

    document.addEventListener('pointermove', handlePointerMove, {
      passive: false,
    });
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [isResizing, onHeightChange]);

  // 選択された行へスクロール
  useEffect(() => {
    if (selectedReport && tableRef.current) {
      const selectedRow = tableRef.current.querySelector(
        `tr[data-report-id="${selectedReport.id}"]`
      );
      if (selectedRow) {
        selectedRow.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedReport]);

  // 日時フォーマット（hasOnlyDate対応）
  const formatDate = (report: ReportDto) =>
    formatReportDateTime(report.createdAt, report.hasOnlyDate);

  // ステータスラベルと色
  const getStatusInfo = (status: string) => {
    const label = REPORT_STATUS_LABELS[status as ReportStatusValue] || status;

    const colorMap: Record<string, string> = {
      waiting: 'bg-solid-red-100 text-solid-red-700',
      completed: 'bg-solid-blue-100 text-solid-blue-700',
    };

    return {
      label,
      color: colorMap[status] || 'bg-solid-gray-100 text-solid-gray-700',
    };
  };

  // ソート済み通報リスト（新しい順）
  const sortedReports = useMemo(() => {
    return [...reports].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [reports]);

  // 地図の範囲内フィルタリング（チェックボックスON時のみ適用）
  const boundsFilteredReports = useMemo(() => {
    if (!filterByBounds || !mapBounds) return sortedReports;
    return sortedReports.filter((report) => {
      const { latitude, longitude } = report;
      return (
        latitude >= mapBounds.south &&
        latitude <= mapBounds.north &&
        longitude >= mapBounds.west &&
        longitude <= mapBounds.east
      );
    });
  }, [sortedReports, filterByBounds, mapBounds]);

  // 範囲フィルタの切り替えやbounds変更時にページネーションをリセット
  const prevBoundsFilteredLengthRef = useRef(boundsFilteredReports.length);
  useEffect(() => {
    if (prevBoundsFilteredLengthRef.current !== boundsFilteredReports.length) {
      prevBoundsFilteredLengthRef.current = boundsFilteredReports.length;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- bounds変更時のページリセットに必要
      setManualPage(1);
      setManualPagingForReportId(null);
    }
  }, [boundsFilteredReports.length]);

  const totalPages = Math.max(
    1,
    Math.ceil(boundsFilteredReports.length / PAGE_SIZE)
  );

  const selectedReportPage = useMemo(() => {
    if (!selectedReport) return null;
    const selectedIndex = boundsFilteredReports.findIndex(
      (report) => report.id === selectedReport.id
    );
    if (selectedIndex === -1) return null;
    return Math.floor(selectedIndex / PAGE_SIZE) + 1;
  }, [selectedReport, boundsFilteredReports]);

  // ページネーションボタン押下時の選択通報IDと現在の選択通報IDが一致する場合のみ
  // manualPageを優先する（通報選択が変わったら自動的にselectedReportPageに戻る）
  const isManualPaging =
    manualPagingForReportId !== null &&
    manualPagingForReportId === (selectedReport?.id ?? null);

  const currentPage = useMemo(() => {
    const page = isManualPaging
      ? manualPage
      : (selectedReportPage ?? manualPage);
    return Math.min(Math.max(page, 1), totalPages);
  }, [isManualPaging, selectedReportPage, manualPage, totalPages]);

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return boundsFilteredReports.slice(start, start + PAGE_SIZE);
  }, [boundsFilteredReports, currentPage]);

  // CSVダウンロード
  const handleDownloadCsv = useCallback(() => {
    const header = ['獣種', 'ステータス', '住所', '説明', '作成日時'];
    const rows = boundsFilteredReports.map((report) => {
      const animalLabel =
        ANIMAL_MARKER_CONFIG[report.animalType]?.label ?? report.animalType;
      const statusLabel =
        REPORT_STATUS_LABELS[report.status as ReportStatusValue] ??
        report.status;
      const description = report.description
        ? stripMarkdown(report.description)
        : '';
      return [
        animalLabel,
        statusLabel,
        report.address || '',
        description,
        formatDate(report),
      ];
    });

    const escapeCsvField = (field: string) => {
      if (/[",\n\r]/.test(field)) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const csvContent =
      '\uFEFF' +
      [header, ...rows].map((row) => row.map(escapeCsvField).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const now = new Date();
    const timestamp = new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Tokyo',
    })
      .format(now)
      .replace(/\//g, '')
      .replace(/:/g, '')
      .replace(' ', '_');
    link.download = `通報データ_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [boundsFilteredReports]);

  return (
    <div
      className={`
        absolute bottom-0 left-0 flex flex-col border-t border-solid-gray-300
        bg-white shadow-2xl
      `}
      style={{
        height: `${height}px`,
        zIndex: Z_MAP_DATA_PANEL,
        right: panelOpen ? `${panelWidth ?? 288}px` : 0,
      }}
    >
      {/* リサイズハンドル */}
      <div
        onPointerDown={handlePointerDown}
        className={`
          group relative flex h-3 shrink-0 cursor-ns-resize touch-none
          items-center justify-center bg-solid-gray-100 transition-colors
          select-none
          hover:bg-solid-gray-200
          ${isResizing ? 'bg-solid-blue-200' : ''}
        `}
      >
        {/* ドラッグインジケーター（3本線） */}
        <div className="flex flex-col gap-0.5">
          <div
            className={`
              h-0.5 w-8 rounded-full bg-solid-gray-400 transition-colors
              group-hover:bg-solid-gray-600
            `}
          />
          <div
            className={`
              h-0.5 w-8 rounded-full bg-solid-gray-400 transition-colors
              group-hover:bg-solid-gray-600
            `}
          />
          <div
            className={`
              h-0.5 w-8 rounded-full bg-solid-gray-400 transition-colors
              group-hover:bg-solid-gray-600
            `}
          />
        </div>
      </div>

      {/* 地図の範囲内フィルター（スクロール領域の外） */}
      <div
        className={`
          flex shrink-0 items-center gap-2 border-b border-solid-gray-200
          bg-solid-gray-50 px-4 py-1.5
        `}
      >
        <label
          className={`
            flex cursor-pointer items-center gap-1.5 text-xs text-solid-gray-700
          `}
        >
          <input
            type="checkbox"
            checked={filterByBounds}
            onChange={(e) => setFilterByBounds(e.target.checked)}
            className="size-3.5 accent-blue-600"
          />
          地図の範囲内のみ表示
        </label>
        <span className="text-xs text-solid-gray-500">
          ({boundsFilteredReports.length}件)
        </span>
        {/* CSVダウンロードボタン（管理者のみ） */}
        {isAdminMode && (
          <button
            onClick={handleDownloadCsv}
            className={`
              ml-auto rounded px-1 text-solid-gray-500 transition-colors
              hover:bg-solid-gray-200 hover:text-solid-gray-700
            `}
            aria-label="CSVダウンロード"
            title="CSVダウンロード"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
              />
            </svg>
          </button>
        )}
        {/* 閉じるボタン */}
        {onClose && (
          <button
            onClick={onClose}
            className={`
              rounded px-1 text-solid-gray-500 transition-colors
              hover:bg-solid-gray-200 hover:text-solid-gray-700
              ${!isAdminMode ? 'ml-auto' : ''}
            `}
            aria-label="データパネルを閉じる"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table ref={tableRef} className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-solid-gray-50">
            <tr className="border-b border-solid-gray-200">
              <th
                className={`
                  px-4 py-3 font-medium whitespace-nowrap text-solid-gray-700
                `}
              >
                獣種
              </th>
              <th
                className={`
                  px-4 py-3 font-medium whitespace-nowrap text-solid-gray-700
                `}
              >
                ステータス
              </th>
              <th
                className={`
                  px-4 py-3 font-medium whitespace-nowrap text-solid-gray-700
                `}
              >
                住所
              </th>
              <th
                className={`
                  px-4 py-3 font-medium whitespace-nowrap text-solid-gray-700
                `}
              >
                説明
              </th>
              <th
                className={`
                  px-4 py-3 font-medium whitespace-nowrap text-solid-gray-700
                `}
              >
                作成日時
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedReports.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-solid-gray-500"
                >
                  表示する通報がありません
                </td>
              </tr>
            ) : (
              paginatedReports.map((report) => {
                const animalConfig =
                  ANIMAL_MARKER_CONFIG[report.animalType] || {};
                const statusInfo = getStatusInfo(report.status);
                const isSelected = selectedReport?.id === report.id;
                return (
                  <tr
                    key={report.id}
                    data-report-id={report.id}
                    onClick={() => onReportSelect?.(report)}
                    className={`
                      cursor-pointer border-b border-solid-gray-100
                      transition-colors
                      ${
                        isSelected
                          ? `
                            border-l-4 border-l-blue-500 bg-blue-100
                            hover:bg-blue-100
                          `
                          : 'hover:bg-solid-gray-50'
                      }
                    `}
                  >
                    {/* 獣種 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{animalConfig.emoji}</span>
                        <span className="text-solid-gray-900">
                          {animalConfig.label}
                        </span>
                      </div>
                    </td>

                    {/* ステータス */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`
                          inline-flex items-center rounded-full px-2.5 py-0.5
                          text-xs font-medium
                          ${statusInfo.color}
                        `}
                      >
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* 住所 */}
                    <td className="px-4 py-3">
                      <div className="max-w-md truncate text-solid-gray-900">
                        {report.address || '住所なし'}
                      </div>
                    </td>

                    {/* 説明 */}
                    <td className="px-4 py-3">
                      <div className="max-w-lg truncate text-solid-gray-600">
                        {report.description
                          ? stripMarkdown(report.description)
                          : '説明なし'}
                      </div>
                    </td>

                    {/* 作成日時 */}
                    <td
                      className={`
                        px-4 py-3 whitespace-nowrap text-solid-gray-600
                      `}
                    >
                      {formatDate(report)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ページネーション（スクロール領域の外） */}
      {totalPages > 1 && (
        <div
          className={`
            flex shrink-0 items-center justify-between border-t
            border-solid-gray-200 px-4 py-2
          `}
        >
          <p className="text-xs text-solid-gray-600">
            {boundsFilteredReports.length}件中{' '}
            {(currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, boundsFilteredReports.length)}
            件を表示
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setManualPagingForReportId(selectedReport?.id ?? null);
                setManualPage(1);
              }}
              disabled={currentPage === 1}
              className={`
                rounded border border-solid-gray-300 px-2 py-1 text-xs
                text-solid-gray-700
                disabled:cursor-not-allowed disabled:opacity-50
              `}
            >
              最初
            </button>
            <button
              type="button"
              onClick={() => {
                setManualPagingForReportId(selectedReport?.id ?? null);
                setManualPage((page) => Math.max(1, page - 1));
              }}
              disabled={currentPage === 1}
              className={`
                rounded border border-solid-gray-300 px-2 py-1 text-xs
                text-solid-gray-700
                disabled:cursor-not-allowed disabled:opacity-50
              `}
            >
              前へ
            </button>
            <span className="text-xs text-solid-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => {
                setManualPagingForReportId(selectedReport?.id ?? null);
                setManualPage((page) => Math.min(totalPages, page + 1));
              }}
              disabled={currentPage === totalPages}
              className={`
                rounded border border-solid-gray-300 px-2 py-1 text-xs
                text-solid-gray-700
                disabled:cursor-not-allowed disabled:opacity-50
              `}
            >
              次へ
            </button>
            <button
              type="button"
              onClick={() => {
                setManualPagingForReportId(selectedReport?.id ?? null);
                setManualPage(totalPages);
              }}
              disabled={currentPage === totalPages}
              className={`
                rounded border border-solid-gray-300 px-2 py-1 text-xs
                text-solid-gray-700
                disabled:cursor-not-allowed disabled:opacity-50
              `}
            >
              最後
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDataPanel;
