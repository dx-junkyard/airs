import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { deleteStaff } from '@/features/staff/actions';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

/**
 * Staff削除のMutation
 */
function useDeleteStaff() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteStaff(id);
    },

    onSuccess: (_data, id) => {
      // 削除されたStaffのキャッシュを削除
      queryClient.removeQueries({
        queryKey: queryKeys.staffs.detail(id),
      });

      // リスト系のクエリを無効化
      queryClient.invalidateQueries({
        queryKey: queryKeys.staffs.lists(),
      });

      // 成功トースト表示
      showSuccessToast('職員を削除しました');

      // 一覧ページへ遷移
      router.push('/admin/staff');
    },

    onError: (error: Error) => {
      console.error('Staff削除エラー:', error);
      showErrorToast(
        error.message || '削除に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useDeleteStaff;
