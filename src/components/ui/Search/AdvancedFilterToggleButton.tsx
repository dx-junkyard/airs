'use client';

import {
  faSlidersH,
  faChevronUp,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '@/components/ui/Button/Button';

export interface AdvancedFilterToggleButtonProps {
  /** 詳細フィルターが開いているかどうか */
  isOpen: boolean;
  /** 開閉トグルのコールバック */
  onToggle: () => void;
  /** ボタンラベル（デフォルト: "詳細"） */
  label?: string;
}

/**
 * 詳細フィルター展開ボタン
 *
 * 詳細フィルターパネルの表示/非表示を切り替えるボタン。
 */
export default function AdvancedFilterToggleButton({
  isOpen,
  onToggle,
  label = '詳細',
}: AdvancedFilterToggleButtonProps) {
  return (
    <Button
      size="md"
      variant="outline"
      onClick={onToggle}
      className={`
        inline-flex items-center gap-1.5
        sm:gap-2
        ${isOpen ? 'border-blue-300 bg-blue-50' : ''}
      `}
      aria-expanded={isOpen}
      aria-label="詳細フィルター"
    >
      <FontAwesomeIcon icon={faSlidersH} className="size-4" />
      <span
        className={`
          hidden text-sm
          sm:inline
        `}
      >
        {label}
      </span>
      <FontAwesomeIcon
        icon={isOpen ? faChevronUp : faChevronDown}
        className="size-3"
      />
    </Button>
  );
}
