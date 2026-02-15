import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleFacilityShared } from '@/features/facility/actions';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

/**
 * Facility全体共有トグルのMutation
 */
function useToggleFacilityShared(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      facilityId,
      isShared,
    }: {
      facilityId: string;
      isShared: boolean;
    }) => {
      return await toggleFacilityShared(facilityId, isShared);
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.facilities.byStaff(staffId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.facilities.shared(),
      });

      showSuccessToast(
        variables.isShared
          ? '全体共有をオンにしました'
          : '全体共有をオフにしました'
      );
    },

    onError: (error: Error) => {
      showErrorToast(
        error.message || '更新に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useToggleFacilityShared;
