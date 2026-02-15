import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';

interface EventCountBadgeProps {
  /** 通報件数 */
  count: number;
  /** サイズバリアント */
  size?: 'sm' | 'md';
}

/**
 * イベント通報件数バッジ
 *
 * イベントに紐づく通報件数を表示する共通コンポーネント。
 * イベント一覧と通報一覧で使用。
 */
export default function EventCountBadge({
  count,
  size = 'md',
}: EventCountBadgeProps) {
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-3 py-1 text-sm gap-1.5';

  const iconSize = size === 'sm' ? 'size-3' : 'size-3.5';

  return (
    <span
      className={`
        inline-flex items-center rounded-full bg-blue-100 font-medium
        text-blue-800
        ${sizeClasses}
      `}
    >
      <FontAwesomeIcon icon={faLayerGroup} className={iconSize} />
      {count}件
    </span>
  );
}
