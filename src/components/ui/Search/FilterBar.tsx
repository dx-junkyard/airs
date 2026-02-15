'use client';

import { type ReactNode } from 'react';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card } from '@/components/ui/Card/Card';
import Input from '@/components/ui/Input/Input';
import Select from '@/components/ui/Select/Select';

/**
 * フィルターオプション定義
 */
export interface FilterOption {
  /** オプション値 */
  value: string;
  /** 表示ラベル */
  label: string;
}

/**
 * ドロップダウンフィルター定義
 */
export interface FilterSelectConfig {
  /** フィルターID */
  id: string;
  /** 現在の値 */
  value: string;
  /** スクリーンリーダー向けラベル */
  ariaLabel: string;
  /** 選択肢 */
  options: FilterOption[];
  /** 値変更時のコールバック */
  onChange: (value: string) => void;
  /** 最小幅（デフォルト: min-w-40） */
  minWidth?: string;
}

export interface FilterBarProps {
  /** キーワード検索の設定（省略可能） */
  search?: {
    /** 現在の検索値 */
    value: string;
    /** プレースホルダー */
    placeholder?: string;
    /** 検索値変更時のコールバック */
    onSearch: (value: string) => void;
  };
  /** ドロップダウンフィルター設定 */
  filters?: FilterSelectConfig[];
  /** フィルターバー右側に表示するアクション（詳細ボタン、表示切替等） */
  actions?: ReactNode;
  /** 詳細フィルターパネル（展開時に表示） */
  advancedPanel?: ReactNode;
  /** カード内の追加コンテンツ */
  children?: ReactNode;
}

/**
 * フィルターバー
 *
 * 検索フィールドとドロップダウンフィルターを含むメインフィルターバー。
 * actions propで詳細ボタンや表示切替などのアクションを追加可能。
 */
export default function FilterBar({
  search,
  filters = [],
  actions,
  advancedPanel,
  children,
}: FilterBarProps) {
  return (
    <Card padding="md">
      <div
        className={`
          -m-2 flex flex-col gap-2 p-2
          sm:flex-row sm:items-center sm:overflow-x-auto
        `}
      >
        {/* キーワード検索（アイコン付き） */}
        {search && (
          <div
            className={`
              relative min-w-0 flex-1
              sm:max-w-[28rem] sm:min-w-64
            `}
          >
            <div
              className={`
                pointer-events-none absolute inset-y-0 left-0 flex items-center
                pl-3
              `}
            >
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="size-4 text-solid-gray-400"
              />
            </div>
            <Input
              key={search.value}
              id="search"
              type="text"
              aria-label="キーワード検索"
              placeholder={search.placeholder ?? '検索'}
              defaultValue={search.value}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  search.onSearch(e.currentTarget.value);
                }
              }}
              onBlur={(e) => {
                if (e.currentTarget.value !== search.value) {
                  search.onSearch(e.currentTarget.value);
                }
              }}
              className="w-full pl-10"
              blockSize="md"
            />
          </div>
        )}

        {/* ドロップダウンフィルター */}
        {filters.length > 0 && (
          <div
            className={`
              flex min-w-0 flex-1 items-center gap-2
              sm:flex-none sm:shrink-0
            `}
          >
            {filters.map((filter) => (
              <div
                key={filter.id}
                className={`
                  min-w-0 flex-1 basis-0
                  sm:flex-none sm:basis-auto
                  ${filter.minWidth ?? 'sm:min-w-40'}
                `}
              >
                <Select
                  id={filter.id}
                  aria-label={filter.ariaLabel}
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                >
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
        )}

        {/* アクション（詳細ボタン、表示切替等） */}
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>

      {/* 詳細フィルターパネル */}
      {advancedPanel}

      {/* 追加コンテンツ */}
      {children}
    </Card>
  );
}
