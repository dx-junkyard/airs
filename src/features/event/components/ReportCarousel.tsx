'use client';

import { useRef, useEffect, useState } from 'react';
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

/** ステータステキスト色マッピング */
const STATUS_TEXT_COLORS: Record<ReportStatusValue, string> = {
  waiting: 'text-status-waiting',
  completed: 'text-status-completed',
};

interface CarouselReport {
  id: string;
  animalType: string;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
  hasOnlyDate?: boolean;
  status: string;
}

interface ReportCarouselProps {
  reports: CarouselReport[];
  selectedReportId?: string | null;
  onSlideChange?: (report: CarouselReport) => void;
}

const ReportCarousel = ({
  reports,
  selectedReportId,
  onSlideChange,
}: ReportCarouselProps) => {
  // 時系列順（古い→新しい）
  const sortedReports = [...reports].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isExternalUpdate = useRef(false);

  // インジケータークリックでスクロール
  const scrollToIndex = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = container.offsetWidth * 0.85 + 12;
    container.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth',
    });
  };

  // 外部からselectedReportIdが変更された時にスクロール
  useEffect(() => {
    if (selectedReportId) {
      const index = sortedReports.findIndex((r) => r.id === selectedReportId);
      if (index !== -1 && index !== currentIndex) {
        isExternalUpdate.current = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部propから内部stateへの同期
        setCurrentIndex(index);
        scrollToIndex(index);
      }
    }
  }, [selectedReportId, sortedReports, currentIndex]);

  // スクロール位置から現在のインデックスを計算
  const handleScroll = () => {
    // 外部更新中はスキップ
    if (isExternalUpdate.current) {
      isExternalUpdate.current = false;
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const cardWidth = container.offsetWidth * 0.85 + 12; // カード幅 + gap
    const newIndex = Math.round(scrollLeft / cardWidth);

    if (
      newIndex !== currentIndex &&
      newIndex >= 0 &&
      newIndex < sortedReports.length
    ) {
      setCurrentIndex(newIndex);
      if (onSlideChange) {
        onSlideChange(sortedReports[newIndex]);
      }
    }
  };

  const formatDateTime = (dateString: string, hasOnlyDate?: boolean) => {
    const date = new Date(dateString);
    return {
      date: new Intl.DateTimeFormat('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        timeZone: 'Asia/Tokyo',
      }).format(date),
      time: hasOnlyDate
        ? '--:--'
        : new Intl.DateTimeFormat('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Tokyo',
          }).format(date),
    };
  };

  if (sortedReports.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* スクロール可能なカードリスト */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`
          flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2
          [-ms-overflow-style:none]
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        `}
        style={{ scrollPaddingLeft: '8px' }}
      >
        {sortedReports.map((report) => {
          const { date, time } = formatDateTime(report.createdAt, report.hasOnlyDate);
          const statusTextColor =
            STATUS_TEXT_COLORS[report.status as ReportStatusValue] ??
            'text-solid-gray-600';

          return (
            <Link
              key={report.id}
              href={`/admin/report/${report.id}`}
              className={`
                w-[85%] shrink-0 snap-center overflow-hidden rounded-xl bg-white
                shadow-lg transition-transform
                first:ml-2
                last:mr-2
                hover:scale-[1.02]
              `}
            >
              <div className="flex items-center gap-3 p-4">
                {/* 時刻 */}
                <div
                  className={`
                    flex shrink-0 flex-col items-center text-base
                    text-solid-gray-600
                  `}
                >
                  <span className="text-lg font-bold text-solid-gray-800">
                    {time}
                  </span>
                  <span className="text-sm">{date}</span>
                </div>

                {/* 区切り線 */}
                <div className="h-12 w-px bg-solid-gray-200" />

                {/* 内容 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {getAnimalTypeEmoji(report.animalType)}
                    </span>
                    <span
                      className={`
                        truncate text-base font-bold text-solid-gray-800
                      `}
                    >
                      {getAnimalTypeLabel(report.animalType)}
                    </span>
                    <span
                      className={`
                        shrink-0 text-sm font-medium
                        ${statusTextColor}
                      `}
                    >
                      {REPORT_STATUS_LABELS[report.status as ReportStatusValue]}
                    </span>
                  </div>
                  <div
                    className={`
                      mt-1.5 flex items-center gap-1.5 text-sm
                      text-solid-gray-500
                    `}
                  >
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="size-3.5" />
                    <span className="truncate">{report.address}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* インジケーター */}
      <div className="flex items-center justify-center gap-2">
        {sortedReports.map((report, index) => (
          <button
            key={report.id}
            type="button"
            onClick={() => {
              scrollToIndex(index);
              setCurrentIndex(index);
              if (onSlideChange) {
                onSlideChange(sortedReports[index]);
              }
            }}
            className={
              index === currentIndex
                ? 'size-2.5 rounded-full bg-white shadow-md transition-all'
                : 'size-2 rounded-full bg-white/50 transition-all'
            }
            aria-label={`通報 ${index + 1}`}
          />
        ))}
        <span className="ml-2 text-sm text-white/80">
          {currentIndex + 1} / {sortedReports.length}
        </span>
      </div>
    </div>
  );
};

export default ReportCarousel;
