import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { deleteReport } from '@/features/report/actions';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

/**
 * Report削除のMutation
 */
function useDeleteReport() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteReport(id);
    },

    onSuccess: (_data, id) => {
      // 削除されたReportのキャッシュを削除
      queryClient.removeQueries({
        queryKey: queryKeys.reports.detail(id),
      });

      // リスト系のクエリを無効化
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.lists(),
      });

      // 成功トースト表示
      showSuccessToast('通報を削除しました');

      // 一覧ページへ遷移
      router.push('/admin/report');
    },

    onError: (error: Error) => {
      console.error('Report削除エラー:', error);
      showErrorToast(
        error.message || '削除に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useDeleteReport;
