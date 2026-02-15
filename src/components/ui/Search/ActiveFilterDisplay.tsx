'use client';

import FilterChip from './FilterChip';

/**
 * アクティブフィルター定義
 */
export interface ActiveFilter {
  /** フィルターキー（一意識別子） */
  key: string;
  /** 表示ラベル */
  label: string;
  /** 削除時のコールバック */
  onRemove: () => void;
}

export interface ActiveFilterDisplayProps {
  /** アクティブなフィルター一覧 */
  filters: ActiveFilter[];
  /** すべてクリアボタンのコールバック */
  onClearAll: () => void;
  /** プレフィックスラベル（デフォルト: "アクティブなフィルター:"） */
  prefix?: string;
  /** すべてクリアボタンのラベル（デフォルト: "すべてクリア"） */
  clearAllLabel?: string;
}

/**
 * アクティブフィルター表示
 *
 * 適用中のフィルターをチップ形式で表示し、個別削除や一括クリアが可能。
 */
export default function ActiveFilterDisplay({
  filters,
  onClearAll,
  prefix = 'アクティブなフィルター:',
  clearAllLabel = 'すべてクリア',
}: ActiveFilterDisplayProps) {
  // フィルターがない場合は表示しない
  if (filters.length === 0) return null;

  return (
    <div
      className={`
        flex flex-wrap items-center gap-2 rounded-lg bg-solid-gray-50 px-4 py-3
      `}
    >
      <span className="text-xs font-medium text-solid-gray-600">{prefix}</span>

      {filters.map((filter) => (
        <FilterChip
          key={filter.key}
          label={filter.label}
          onRemove={filter.onRemove}
        />
      ))}

      <button
        onClick={onClearAll}
        className={`
          ml-auto text-xs font-medium text-blue-600 transition-colors
          hover:text-blue-700 hover:underline
          focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          focus:outline-none
        `}
      >
        {clearAllLabel}
      </button>
    </div>
  );
}
