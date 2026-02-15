'use client';

import { useCallback, useState, useTransition } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updateReport } from '@/features/report/actions';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  REPORT_STATUS_LABELS,
  type ReportStatusValue,
} from '@/server/domain/constants/reportStatuses';

interface ClickableStatusBadgeProps {
  reportId: string;
  status: ReportStatusValue;
}

const STATUS_BG_COLORS: Record<ReportStatusValue, string> = {
  waiting: 'bg-status-waiting',
  completed: 'bg-status-completed',
};

const baseClassName =
  'text-oln-16N-100 ml-2 inline-block min-w-20 rounded-lg p-2 text-center text-white outline-1 outline-transparent';

export default function ClickableStatusBadge({
  reportId,
  status,
}: ClickableStatusBadgeProps) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(status);
  const queryClient = useQueryClient();

  const handleClick = useCallback(() => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('status', 'completed');
      await updateReport(reportId, formData);
      setLocalStatus('completed');
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    });
  }, [reportId, queryClient]);

  if (localStatus === 'waiting') {
    return (
      <span className="group relative inline-block">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClick();
          }}
          disabled={isPending}
          className={`
            ${baseClassName}
            ${STATUS_BG_COLORS.waiting}
            cursor-pointer transition-opacity
            hover:opacity-80
            disabled:opacity-50
          `}
        >
          {isPending ? '更新中...' : REPORT_STATUS_LABELS.waiting}
        </button>
        <span
          className={`
            pointer-events-none absolute bottom-full left-1/2 z-10 mb-2
            -translate-x-1/2 rounded bg-solid-gray-800 px-2.5 py-1.5 text-xs
            whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity
            group-hover:opacity-100
          `}
        >
          クリックで確認完了にする
          <span
            className={`
              absolute top-full left-1/2 -translate-x-1/2 border-4
              border-transparent border-t-solid-gray-800
            `}
          />
        </span>
      </span>
    );
  }

  return (
    <span
      className={`
        ${baseClassName}
        ${STATUS_BG_COLORS.completed}
      `}
    >
      {REPORT_STATUS_LABELS.completed}
    </span>
  );
}
