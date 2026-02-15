'use client';

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * 表示モードオプション定義
 */
export interface ViewModeOption<T extends string = string> {
  /** モード値 */
  value: T;
  /** 表示ラベル */
  label: string;
  /** アイコン */
  icon: IconDefinition;
}

export interface ViewModeToggleProps<T extends string = string> {
  /** 現在のモード */
  value: T;
  /** モード変更時のコールバック */
  onChange: (value: T) => void;
  /** モードオプション一覧 */
  options: ViewModeOption<T>[];
}

/**
 * 表示モード切替トグル
 *
 * リスト/地図などの表示モードを切り替えるトグルボタン。
 */
export default function ViewModeToggle<T extends string = string>({
  value,
  onChange,
  options,
}: ViewModeToggleProps<T>) {
  return (
    <div
      className={`
        flex gap-1 rounded-lg border border-solid-gray-200 bg-solid-gray-50 p-1
      `}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm
              transition-all
              ${
                isActive
                  ? `scale-105 bg-blue-600 text-white shadow-md`
                  : `
                    font-medium text-solid-gray-700
                    hover:bg-white hover:shadow-sm
                  `
              }
            `}
            aria-pressed={isActive}
          >
            <FontAwesomeIcon icon={option.icon} className="size-3.5" />
            <span
              className={`
                hidden
                sm:inline
              `}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
