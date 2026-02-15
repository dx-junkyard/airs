'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { createRoot, Root } from 'react-dom/client';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import { ANIMAL_MARKER_CONFIG } from '@/features/report/constants/animalMarkerConfig';
import { createAnimalIcon } from '@/features/map/utils/markerUtils';

interface ReportSearchControlProps {
  reports: ReportDto[];
  onReportSelect?: (report: ReportDto) => void;
}

interface SearchUIProps {
  query: string;
  results: ReportDto[];
  isOpen: boolean;
  isComposing: boolean;
  onQueryChange: (value: string) => void;
  onCompositionStart: () => void;
  onCompositionEnd: (value: string) => void;
  onSelectReport: (report: ReportDto) => void;
}

/**
 * 検索UI（Leafletカスタムコントロール内にマウントされるReactコンポーネント）
 */
function SearchUI({
  query,
  results,
  isOpen,
  isComposing,
  onQueryChange,
  onCompositionStart,
  onCompositionEnd,
  onSelectReport,
}: SearchUIProps) {
  return (
    <div className="relative">
      {/* 検索入力 */}
      <div className="relative">
        <input
          type="text"
          placeholder="通報を検索"
          defaultValue={query}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isComposing) {
              const val = (e.target as HTMLInputElement).value;
              onCompositionEnd(val);
            }
          }}
          onChange={(e) => {
            // IME入力中でなければ、即座に検索実行
            if (!isComposing) {
              onQueryChange(e.target.value);
              onCompositionEnd(e.target.value);
            }
          }}
          onCompositionStart={onCompositionStart}
          onCompositionUpdate={(e) => {
            // IME入力中は値を更新するだけ（検索は実行しない）
            onQueryChange((e.target as HTMLInputElement).value);
          }}
          onCompositionEnd={(e) => {
            const value = (e.target as HTMLInputElement).value;
            onQueryChange(value);
            onCompositionEnd(value);
          }}
          className={`
            w-full rounded-lg border-0 px-4 py-2 pr-10 text-sm
            focus:ring-2 focus:ring-blue-500 focus:outline-none
          `}
        />
        <button
          type="button"
          aria-label="検索"
          onClick={(e) => {
            if (isComposing) return;
            // read current input value from DOM to avoid stale state / uncontrolled issues
            const btn = e.currentTarget as HTMLElement;
            const parent = btn.parentElement as HTMLElement | null;
            const inputEl = parent?.querySelector(
              'input'
            ) as HTMLInputElement | null;
            const val = inputEl ? inputEl.value : (query ?? '');
            onCompositionEnd(val);
          }}
          className={`
            absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-400
          `}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>

      {/* 検索結果 */}
      {isOpen && results.length > 0 && (
        <div
          className={`
            absolute top-full right-0 left-0 z-[1000] mt-1 max-h-80
            overflow-y-auto rounded-lg bg-white shadow-lg
          `}
        >
          {results.map((report) => (
            <button
              key={report.id}
              onClick={() => onSelectReport(report)}
              className={`
                w-full border-b border-gray-100 px-4 py-3 text-left
                transition-colors
                last:border-0
                hover:bg-gray-100
              `}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="flex items-center text-lg">
                  {ANIMAL_MARKER_CONFIG[report.animalType]?.emoji ? (
                    ANIMAL_MARKER_CONFIG[report.animalType].emoji
                  ) : (
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      className="size-4 text-solid-gray-600"
                    />
                  )}
                </span>
                <span className="font-medium text-gray-900">
                  {ANIMAL_MARKER_CONFIG[report.animalType]?.label || '不明'}
                </span>
              </div>
              <div className="text-sm text-gray-700">{report.address}</div>
              {report.description && (
                <div
                  className={`
                    mt-1 line-clamp-6 text-xs whitespace-pre-line text-gray-500
                  `}
                >
                  {report.description}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ReportSearchControlProps {
  reports: ReportDto[];
  onReportSelect?: (report: ReportDto) => void;
}

/**
 * 通報検索コントロール（Leaflet カスタムコントロール）
 *
 * 地図の左上に検索バーを表示し、通報を住所・説明・獣種で検索できる。
 * 検索結果を選択すると地図が該当位置に移動する。
 */
export default function ReportSearchControl({
  reports,
  onReportSelect,
}: ReportSearchControlProps) {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReportDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const rootRef = useRef<Root | null>(null);

  // 検索ロジック
  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      const normalizedQuery = searchQuery.toLowerCase();
      const filtered = reports.filter((report) => {
        return (
          report.address.toLowerCase().includes(normalizedQuery) ||
          report.description?.toLowerCase().includes(normalizedQuery) ||
          ANIMAL_MARKER_CONFIG[report.animalType]?.label
            .toLowerCase()
            .includes(normalizedQuery)
        );
      });

      setResults(filtered.slice(0, 10)); // 最大10件
      setIsOpen(filtered.length > 0);
    },
    [reports]
  );

  // 通報を選択
  const handleSelectReport = useCallback(
    (report: ReportDto) => {
      // 親コンポーネントに選択を通知（親が selectedReport を管理して
      // 移動・ハイライトを行う。Search側で地図移動を行わず統一する）
      onReportSelect?.(report);

      // (旧実装の一時マーカー／ポップアップ生成は削除し、親へ通知のみ行う)

      // 検索をクリア
      setQuery('');
      setResults([]);
      setIsOpen(false);
    },
    [onReportSelect]
  );

  // no-op cleanup (マーカーは親で管理されるため不要)

  // 入力変更ハンドラ（IME入力中のみ呼ばれる）
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  // IME開始ハンドラ
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  // IME終了ハンドラ
  const handleCompositionEnd = useCallback(
    (value: string) => {
      setIsComposing(false);
      handleSearch(value);
    },
    [handleSearch]
  );

  // カスタムコントロールを作成（一度だけ実行）
  useEffect(() => {
    const CustomSearchControl = L.Control.extend({
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-control-search');
        container.style.cssText = `
          position: absolute;
          top: 10px;
          left: 50px;
          z-index: 1000;
          background: white;
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          min-width: 200px;
          max-width: calc(100vw - 120px);
        `;

        // 地図イベントの干渉を防ぐ
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        // Reactコンポーネントをマウント
        rootRef.current = createRoot(container);

        return container;
      },

      onRemove: function () {
        // クリーンアップ（非同期で実行してレース条件を回避）
        if (rootRef.current) {
          const root = rootRef.current;
          rootRef.current = null;
          setTimeout(() => {
            root.unmount();
          }, 0);
        }
      },
    });

    const control = new CustomSearchControl({ position: 'topleft' });
    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map]);

  // 状態が変更されるたびにUIを再レンダリング
  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.render(
        <SearchUI
          query={query}
          results={results}
          isOpen={isOpen}
          isComposing={isComposing}
          onQueryChange={handleQueryChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onSelectReport={handleSelectReport}
        />
      );
    }
  }, [
    query,
    results,
    isOpen,
    isComposing,
    handleQueryChange,
    handleCompositionStart,
    handleCompositionEnd,
    handleSelectReport,
  ]);

  return null;
}
