import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStaffLocation } from '@/features/staff/actions';
import type { CreateStaffLocationDto } from '@/server/application/dtos/CreateStaffLocationDto';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

/**
 * StaffLocation作成のMutation
 */
function useCreateStaffLocation(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateStaffLocationDto) => {
      return await createStaffLocation(dto);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.staffLocations.byStaff(staffId),
      });

      showSuccessToast('担当地域ピンを追加しました');
    },

    onError: (error: Error) => {
      console.error('StaffLocation作成エラー:', error);
      showErrorToast(
        error.message || '追加に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useCreateStaffLocation;
