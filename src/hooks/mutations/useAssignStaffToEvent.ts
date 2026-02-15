import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { assignStaffToEvent } from '@/features/event/actions';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

interface AssignStaffParams {
  eventId: string;
  staffId: string;
}

/**
 * イベントと紐づく通報に担当者を設定するMutation
 */
function useAssignStaffToEvent() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ eventId, staffId }: AssignStaffParams) => {
      return await assignStaffToEvent(eventId, staffId);
    },

    onSuccess: (result) => {
      // 関連するクエリを無効化
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.all,
      });

      if (result.success) {
        showSuccessToast(
          `担当者を設定しました（${result.updatedReportCount}件の通報を更新）`
        );
        router.refresh();
      } else {
        showErrorToast(result.error || '担当者の設定に失敗しました');
      }
    },

    onError: (error: Error) => {
      console.error('担当者設定エラー:', error);
      showErrorToast(
        error.message || '担当者の設定に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useAssignStaffToEvent;
