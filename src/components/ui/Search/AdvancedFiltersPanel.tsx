'use client';

import type { ReactNode } from 'react';

export interface AdvancedFiltersPanelProps {
  /** パネルが開いているかどうか */
  isOpen: boolean;
  /** パネルのコンテンツ */
  children: ReactNode;
  /** 追加のセクション（条件付き表示用） */
  extraSection?: ReactNode;
}

/**
 * 詳細フィルターパネル
 *
 * 展開式の詳細フィルターパネル。アニメーション付きで表示/非表示を切り替え。
 */
export default function AdvancedFiltersPanel({
  isOpen,
  children,
  extraSection,
}: AdvancedFiltersPanelProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`animate-slideDown mt-4 border-t border-solid-gray-200 pt-4`}
      role="region"
      aria-label="詳細フィルター"
    >
      <div
        className={`
          flex flex-col gap-4
          lg:flex-row lg:items-center lg:gap-6
        `}
      >
        {children}
      </div>

      {/* 追加セクション（タイムライン設定など） */}
      {extraSection && (
        <div
          className={`
            mt-4 flex flex-col gap-4 border-t border-solid-gray-100 pt-4
            sm:flex-row sm:flex-wrap sm:items-center sm:gap-6
          `}
        >
          {extraSection}
        </div>
      )}
    </div>
  );
}

/**
 * 詳細フィルター項目
 *
 * ラベルとコントロールをセットで表示するヘルパーコンポーネント。
 */
export interface AdvancedFilterItemProps {
  /** ラベル */
  label: string;
  /** ラベルのhtmlFor属性（省略可能） */
  htmlFor?: string;
  /** コントロール */
  children: ReactNode;
  /** フレックス展開（デフォルト: false） */
  grow?: boolean;
}

export function AdvancedFilterItem({
  label,
  htmlFor,
  children,
  grow = false,
}: AdvancedFilterItemProps) {
  return (
    <div
      className={`
        flex
        ${grow ? 'flex-1' : ''}
        flex-col gap-2
        sm:flex-row sm:items-center sm:gap-3
      `}
    >
      <label
        htmlFor={htmlFor}
        className="shrink-0 text-sm font-medium text-solid-gray-700"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
