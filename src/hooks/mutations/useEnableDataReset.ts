import { useMutation } from '@tanstack/react-query';
import { enableDataReset } from '@/features/admin/actions';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

/**
 * データリセット用パスワード生成のMutation
 */
function useEnableDataReset() {
  return useMutation({
    mutationFn: async (staffId: string): Promise<string> => {
      return await enableDataReset(staffId);
    },

    onSuccess: () => {
      showSuccessToast('パスワードを生成しました');
    },

    onError: (error: Error) => {
      showErrorToast(
        error.message || 'パスワードの生成に失敗しました'
      );
    },
  });
}

export default useEnableDataReset;
