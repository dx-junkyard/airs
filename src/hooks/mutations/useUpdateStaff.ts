import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStaff } from '@/features/staff/actions';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

/**
 * Staff更新のMutation
 */
function useUpdateStaff(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      return await updateStaff(id, formData);
    },

    onSuccess: (data: StaffDto) => {
      // 関連するクエリを無効化
      queryClient.invalidateQueries({
        queryKey: queryKeys.staffs.all,
      });

      // 詳細データを更新
      queryClient.setQueryData(queryKeys.staffs.detail(id), data);

      // 成功トースト表示
      showSuccessToast('職員を更新しました');
    },

    onError: (error: Error) => {
      console.error('Staff更新エラー:', error);
      showErrorToast(
        error.message || '更新に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useUpdateStaff;
