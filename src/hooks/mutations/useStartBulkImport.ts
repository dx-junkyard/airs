'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadCsv } from '@/features/admin/actions';
import type { BulkActionDto } from '@/server/application/dtos/BulkActionDto';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

interface StartBulkImportParams {
  file: File;
  resetBeforeImport: boolean;
  resetPassword?: string;
}

/**
 * CSV一括インポートを非同期で開始するMutationフック
 *
 * 1. CSVファイルをストレージにアップロード
 * 2. API経由でバックグラウンドインポートを開始
 */
function useStartBulkImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      params: StartBulkImportParams
    ): Promise<BulkActionDto> => {
      // 1. ファイルをストレージにアップロード
      const formData = new FormData();
      formData.append('file', params.file);
      const fileUrl = await uploadCsv(formData);

      // 2. バックグラウンドインポートを開始
      const res = await fetch('/api/admin/bulk-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl,
          actionKey: 'csv-import',
          resetBeforeImport: params.resetBeforeImport,
          resetPassword: params.resetPassword,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'インポートの開始に失敗しました');
      }

      return res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bulkActions.all,
      });
      showSuccessToast('インポートを開始しました');
    },

    onError: (error: Error) => {
      console.error('CSVインポート開始エラー:', error);
      showErrorToast(
        error.message || 'インポートの開始に失敗しました。もう一度お試しください。'
      );
    },
  });
}

export default useStartBulkImport;
