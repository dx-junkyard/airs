import type { ComponentProps } from 'react';

import {
  REPORT_STATUS_LABELS,
  type ReportStatusValue,
} from '@/server/domain/constants/reportStatuses';

interface StatusBadgeProps extends Omit<ComponentProps<'span'>, 'children'> {
  status: ReportStatusValue;
}

/** 背景色マッピング（デザイントークン使用） */
const STATUS_BG_COLORS: Record<ReportStatusValue, string> = {
  waiting: 'bg-status-waiting',
  completed: 'bg-status-completed',
};

const StatusBadge = (props: StatusBadgeProps) => {
  const { className, status, ...rest } = props;

  return (
    <span
      className={`
        text-oln-16N-100 ml-2 inline-block min-w-20 rounded-lg p-2 text-center
        text-white outline-1 outline-transparent
        ${STATUS_BG_COLORS[status]}
        ${className ?? ''}
      `}
      {...rest}
    >
      {REPORT_STATUS_LABELS[status]}
    </span>
  );
};

export default StatusBadge;
