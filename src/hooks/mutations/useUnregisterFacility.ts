import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unregisterFacility } from '@/features/facility/actions';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

/**
 * Facility登録解除のMutation
 */
function useUnregisterFacility(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (facilityId: string) => {
      return await unregisterFacility(facilityId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.facilities.byStaff(staffId),
      });

      showSuccessToast('施設を登録解除しました');
    },

    onError: (error: Error) => {
      showErrorToast(
        error.message || '登録解除に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useUnregisterFacility;
