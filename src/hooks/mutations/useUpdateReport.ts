import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateReport } from '@/features/report/actions';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

/**
 * Report更新のMutation
 */
function useUpdateReport(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      return await updateReport(id, formData);
    },

    onSuccess: (data: ReportDto) => {
      // 関連するクエリを無効化
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all,
      });

      // 詳細データを更新
      queryClient.setQueryData(queryKeys.reports.detail(id), data);

      // 成功トースト表示
      showSuccessToast('通報を更新しました');
    },

    onError: (error: Error) => {
      console.error('Report更新エラー:', error);
      showErrorToast(
        error.message || '更新に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useUpdateReport;
