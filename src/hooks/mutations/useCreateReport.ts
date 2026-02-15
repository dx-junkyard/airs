import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createReport } from '@/features/report/actions';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

/**
 * Report作成のMutation
 */
function useCreateReport() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      return await createReport(formData);
    },

    onSuccess: (data: ReportDto) => {
      // すべてのReportリストのキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all,
      });

      // 作成されたReportの詳細をキャッシュに追加
      queryClient.setQueryData(queryKeys.reports.detail(data.id), data);

      // 成功トースト表示
      showSuccessToast('通報を作成しました');

      // 詳細ページへ遷移
      router.push(`/admin/report/${data.id}`);
    },

    onError: (error: Error) => {
      console.error('Report作成エラー:', error);
      showErrorToast(
        error.message || '作成に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useCreateReport;
