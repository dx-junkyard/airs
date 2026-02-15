'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import {
  getAnimalTypeLabel,
  getAnimalTypeEmoji,
} from '@/server/domain/constants/animalTypes';
import {
  REPORT_STATUS_LABELS,
  type ReportStatusValue,
} from '@/server/domain/constants/reportStatuses';

/** ステータス背景色マッピング */
const STATUS_BG_COLORS: Record<ReportStatusValue, string> = {
  waiting: 'bg-status-waiting',
  completed: 'bg-status-completed',
};

interface TimelineReport {
  id: string;
  animalType: string;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
  hasOnlyDate?: boolean;
  status: string;
}

interface ReportTimelineProps {
  reports: TimelineReport[];
  /** 選択中の通報ID（ハイライト表示用） */
  selectedReportId?: string | null;
  /** 通報クリック時のコールバック（指定時はリンク遷移の代わりにコールバックを実行） */
  onSelect?: (report: TimelineReport) => void;
}

const ReportTimeline = ({ reports, selectedReportId, onSelect }: ReportTimelineProps) => {
  // 日時順にソート（古い順→新しい順）
  const sortedReports = [...reports].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // 選択変更時に自動スクロール
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedReportId) {
      const el = cardRefs.current.get(selectedReportId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedReportId]);

  // 上下キーで選択を移動
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!onSelect || !selectedReportId) return;
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const idx = sortedReports.findIndex((r) => r.id === selectedReportId);
      if (idx === -1) return;
      const next =
        e.key === 'ArrowDown'
          ? sortedReports[idx + 1]
          : sortedReports[idx - 1];
      if (next) onSelect(next);
    },
    [onSelect, selectedReportId, sortedReports]
  );

  const formatTime = (dateString: string, hasOnlyDate?: boolean) => {
    if (hasOnlyDate) return '--:--';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    }).format(date);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      timeZone: 'Asia/Tokyo',
    }).format(date);
  };

  return (
    <div
      ref={containerRef}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
      className="flex flex-col items-center outline-none"
    >
      {sortedReports.map((report, index) => {
        const time = formatTime(report.createdAt, report.hasOnlyDate);
        const date = formatDate(report.createdAt);
        const bgColorClass =
          STATUS_BG_COLORS[report.status as ReportStatusValue] ??
          'bg-solid-gray-500';
        const isLast = index === sortedReports.length - 1;

        const isSelected = selectedReportId === report.id;
        const selectedRing = isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : '';

        const cardContent = (
          <div className="flex items-center gap-2 px-2.5 py-2">
            {/* 時刻 */}
            <div className={`
              flex shrink-0 flex-col items-center text-xs opacity-90
            `}>
              <span className="font-medium">{time}</span>
              <span className="text-[10px]">{date}</span>
            </div>

            {/* 区切り線 */}
            <div className="h-8 w-px bg-white/30" />

            {/* 内容 */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-sm">
                  {getAnimalTypeEmoji(report.animalType)}
                </span>
                <span className="truncate text-xs font-medium">
                  {getAnimalTypeLabel(report.animalType)}
                </span>
                <span className={`
                  rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]
                `}>
                  {REPORT_STATUS_LABELS[report.status as ReportStatusValue]}
                </span>
              </div>
              <div className={`
                mt-0.5 flex items-center gap-1 text-[10px] opacity-80
              `}>
                <FontAwesomeIcon icon={faMapMarkerAlt} className="size-2.5" />
                <span className="truncate">{report.address}</span>
              </div>
            </div>
          </div>
        );

        return (
          <div
            key={report.id}
            ref={(el) => {
              if (el) cardRefs.current.set(report.id, el);
            }}
            className="flex w-full flex-col items-center"
          >
            {/* カード */}
            {onSelect ? (
              <button
                type="button"
                onClick={() => {
                  onSelect(report);
                  containerRef.current?.focus();
                }}
                className={`
                  relative w-full overflow-hidden rounded-lg text-left
                  text-white transition-transform
                  hover:scale-[1.02]
                  ${bgColorClass}
                  ${selectedRing}
                `}
              >
                {cardContent}
              </button>
            ) : (
              <Link
                href={`/admin/report/${report.id}`}
                className={`
                  relative w-full overflow-hidden rounded-lg text-white
                  transition-transform
                  hover:scale-[1.02]
                  ${bgColorClass}
                  ${selectedRing}
                `}
              >
                {cardContent}
              </Link>
            )}

            {/* 接続線 */}
            {!isLast && (
              <div
                className="w-0.5 bg-solid-gray-300"
                style={{ height: '24px' }}
              />
            )}
          </div>
        );
      })}

      {sortedReports.length === 0 && (
        <div className="py-8 text-center text-solid-gray-500">
          通報がありません
        </div>
      )}
    </div>
  );
};

export default ReportTimeline;
