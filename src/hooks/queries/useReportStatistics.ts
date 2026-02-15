'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  getReportStatistics,
  type GetReportStatisticsParams,
} from '@/features/report/actions';
import type { ReportStatisticsDto } from '@/server/application/dtos/ReportStatisticsDto';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';

/**
 * 統計情報のQueryフック
 *
 * getReportStatistics Server Actionをラップし、
 * TanStack Queryのキャッシュを活用する。
 * 日付範囲切り替え時はplaceholderDataで前回データを表示しつつ再取得。
 */
export function useReportStatistics(
  params?: GetReportStatisticsParams,
  initialData?: ReportStatisticsDto
) {
  return useQuery({
    queryKey: queryKeys.reports.statistics(
      params as Record<string, unknown> | undefined
    ),
    queryFn: () => getReportStatistics(params),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
