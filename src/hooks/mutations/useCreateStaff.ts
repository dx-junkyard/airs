import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createStaff } from '@/features/staff/actions';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

/**
 * Staff作成のMutation
 */
function useCreateStaff() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      return await createStaff(formData);
    },

    onSuccess: (data: StaffDto) => {
      // すべてのStaffリストのキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: queryKeys.staffs.all,
      });

      // 作成されたStaffの詳細をキャッシュに追加
      queryClient.setQueryData(queryKeys.staffs.detail(data.id), data);

      // 成功トースト表示
      showSuccessToast('職員を作成しました');

      // 詳細ページへ遷移
      router.push(`/admin/staff/${data.id}`);
    },

    onError: (error: Error) => {
      console.error('Staff作成エラー:', error);
      showErrorToast(
        error.message || '作成に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useCreateStaff;
