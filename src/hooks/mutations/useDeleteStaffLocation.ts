import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteStaffLocation } from '@/features/staff/actions';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

/**
 * StaffLocation削除のMutation
 */
function useDeleteStaffLocation(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteStaffLocation(id, staffId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.staffLocations.byStaff(staffId),
      });

      showSuccessToast('担当地域ピンを削除しました');
    },

    onError: (error: Error) => {
      console.error('StaffLocation削除エラー:', error);
      showErrorToast(
        error.message || '削除に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useDeleteStaffLocation;
