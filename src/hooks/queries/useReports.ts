'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getReports } from '@/features/report/actions';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import type { MapDefaultDataRangeValue } from '@/server/domain/constants/mapDefaultDataRange';

/**
 * 全通報取得のQueryフック
 *
 * getReports Server Actionをラップし、
 * TanStack Queryのキャッシュを活用する。
 * 他ページから戻ったときにgcTime内ならキャッシュヒットで即表示。
 */
export function useReports(
  sortOrder?: string,
  initialData?: ReportDto[],
  options?: {
    enabled?: boolean;
    mapDefaultDataRange?: MapDefaultDataRangeValue;
    startDate?: string;
    endDate?: string;
  }
) {
  return useQuery({
    queryKey: queryKeys.reports.list({
      sortOrder,
      mapDefaultDataRange: options?.mapDefaultDataRange ?? 'all',
      startDate: options?.startDate ?? '',
      endDate: options?.endDate ?? '',
    }),
    queryFn: () =>
      getReports(sortOrder, {
        mapDefaultDataRange: options?.mapDefaultDataRange,
        startDate: options?.startDate,
        endDate: options?.endDate,
      }),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    enabled: options?.enabled ?? true,
  });
}
