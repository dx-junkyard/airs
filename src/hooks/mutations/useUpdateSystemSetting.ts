import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateSystemSetting } from '@/features/system-setting/actions';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

/**
 * システム設定更新のMutation
 */
function useUpdateSystemSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      return await updateSystemSetting(formData);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.systemSettings.all,
      });

      showSuccessToast('システム設定を保存しました');
    },

    onError: (error: Error) => {
      console.error('システム設定更新エラー:', error);
      showErrorToast(
        error.message || '保存に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useUpdateSystemSetting;
