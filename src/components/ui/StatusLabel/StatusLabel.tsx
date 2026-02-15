import type { ComponentProps } from 'react';

import {
  REPORT_STATUS_LABELS,
  type ReportStatusValue,
} from '@/server/domain/constants/reportStatuses';

interface StatusLabelProps extends Omit<ComponentProps<'span'>, 'children'> {
  status: ReportStatusValue;
}

/** テキスト色マッピング（デザイントークン使用） */
const STATUS_TEXT_COLORS: Record<ReportStatusValue, string> = {
  waiting: 'text-status-waiting',
  completed: 'text-status-completed',
};

/**
 * ステータスラベルコンポーネント
 * statusを渡すと適切な色とラベルテキストを表示
 */
const StatusLabel = (props: StatusLabelProps) => {
  const { className, status, ...rest } = props;

  return (
    <span
      className={`
        ${STATUS_TEXT_COLORS[status]}
        ${className ?? ''}
      `}
      {...rest}
    >
      {REPORT_STATUS_LABELS[status]}
    </span>
  );
};

export default StatusLabel;
