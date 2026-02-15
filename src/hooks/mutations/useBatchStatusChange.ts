import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateReportsStatusInBatch } from '@/features/report/actions';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

interface BatchStatusChangeParams {
  ids: string[];
  status: string;
  staffId?: string | null;
}

interface BatchStatusChangeResult {
  success: boolean;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
}

/**
 * 複数Reportのステータス一括変更Mutation
 */
function useBatchStatusChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status, staffId }: BatchStatusChangeParams) => {
      return await updateReportsStatusInBatch(ids, status, staffId);
    },

    onSuccess: (result: BatchStatusChangeResult) => {
      // 関連するクエリを無効化
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all,
      });

      // イベント関連のクエリも無効化
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.all,
      });

      if (result.updatedCount === 0 && result.skippedCount > 0) {
        showSuccessToast('すべての通報が既に該当ステータス以上です');
      } else if (result.success) {
        const skippedMsg = result.skippedCount > 0 ? `（${result.skippedCount}件スキップ）` : '';
        showSuccessToast(`${result.updatedCount}件のステータスを更新しました${skippedMsg}`);
      } else {
        showSuccessToast(
          `${result.updatedCount}件更新（${result.errors.length}件失敗）`
        );
      }
    },

    onError: (error: Error) => {
      console.error('一括ステータス変更エラー:', error);
      showErrorToast(
        error.message || '更新に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useBatchStatusChange;
