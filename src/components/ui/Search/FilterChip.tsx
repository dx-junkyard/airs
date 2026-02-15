import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export interface FilterChipProps {
  /** フィルターのラベル */
  label: string;
  /** 削除ボタンクリック時のコールバック */
  onRemove: () => void;
}

/**
 * フィルターチップ
 *
 * アクティブなフィルター条件を表示し、削除可能なチップコンポーネント。
 */
export default function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1
        text-xs font-medium text-blue-700 transition-colors
        hover:bg-blue-100
      `}
    >
      {label}
      <button
        onClick={onRemove}
        className={`
          inline-flex items-center justify-center rounded-sm
          hover:bg-blue-200/50
          focus:ring-2 focus:ring-blue-500 focus:outline-none
        `}
        aria-label={`${label}を削除`}
      >
        <FontAwesomeIcon icon={faXmark} className="size-3" />
      </button>
    </span>
  );
}
