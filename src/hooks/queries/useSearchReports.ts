'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchReportsWithPagination } from '@/features/report/actions';
import type { SearchReportsParams } from '@/features/report/actions';
import type { SearchReportsResult } from '@/server/application/use-cases/report/SearchReportsWithPaginationUseCase';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';

/**
 * 通報検索のQueryフック
 *
 * searchReportsWithPagination Server Actionをラップし、
 * TanStack Queryのキャッシュを活用する。
 * フィルター変更時はplaceholderDataで前回データを表示しつつ再取得。
 */
export function useSearchReports(
  params: SearchReportsParams,
  initialData?: SearchReportsResult
) {
  return useQuery({
    queryKey: queryKeys.reports.list(
      params as unknown as Record<string, unknown>
    ),
    queryFn: () => searchReportsWithPagination(params),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
