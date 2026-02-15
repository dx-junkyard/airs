import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registerFacility } from '@/features/facility/actions';
import type { CreateFacilityDto } from '@/server/application/dtos/CreateFacilityDto';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

/**
 * Facility登録のMutation
 */
function useRegisterFacility(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateFacilityDto) => {
      return await registerFacility(dto);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.facilities.byStaff(staffId),
      });

      showSuccessToast('施設を登録しました');
    },

    onError: (error: Error) => {
      showErrorToast(
        error.message || '登録に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useRegisterFacility;
