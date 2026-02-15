'use client';

export interface ToggleSwitchProps {
  /** 切り替えID */
  id: string;
  /** ラベル */
  label: string;
  /** 現在の値 */
  checked: boolean;
  /** 変更時のコールバック */
  onChange: (checked: boolean) => void;
  /** オン時のラベル（デフォルト: "オン"） */
  onLabel?: string;
  /** オフ時のラベル（デフォルト: "オフ"） */
  offLabel?: string;
}

/**
 * トグルスイッチ
 *
 * オン/オフを切り替えるスイッチコンポーネント。
 */
export default function ToggleSwitch({
  id,
  label,
  checked,
  onChange,
  onLabel = 'オン',
  offLabel = 'オフ',
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor={id}
        className="shrink-0 text-sm font-medium text-solid-gray-700"
      >
        {label}
      </label>
      <button
        id={id}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          focus:outline-none
          ${checked ? 'bg-blue-600' : 'bg-solid-gray-300'}
        `}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`
            pointer-events-none inline-block size-5 rounded-full bg-white shadow
            ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
      <span className="text-xs text-solid-gray-500">
        {checked ? onLabel : offLabel}
      </span>
    </div>
  );
}
