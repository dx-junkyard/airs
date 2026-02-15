import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { createReport } from '@/features/report/actions';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';
import {
  currentStepAtom,
  isProcessingAtom,
} from '@/features/ai-report/atoms/lineVerifyAtoms';

interface UseLineVerifyReportOptions {
  onSuccess?: (data: ReportDto) => void;
  onError?: (error: Error) => void;
}

/**
 * AI獣害通報用のReport作成Mutation
 *
 * 通常のuseCreateReportとの違い:
 * - 完了後にページ遷移せず、完了ステップへ移行
 * - シミュレーター固有の状態管理と連携
 */
function useLineVerifyReport(options?: UseLineVerifyReportOptions) {
  const queryClient = useQueryClient();
  const setCurrentStep = useSetAtom(currentStepAtom);
  const setIsProcessing = useSetAtom(isProcessingAtom);

  return useMutation({
    mutationFn: async (formData: FormData) => {
      return await createReport(formData);
    },

    onSuccess: (data: ReportDto) => {
      // キャッシュ無効化
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all,
      });

      // 作成されたReportをキャッシュに追加
      queryClient.setQueryData(queryKeys.reports.detail(data.id), data);

      // 成功トースト
      showSuccessToast('通報を作成しました');

      // 完了ステップへ移行
      setCurrentStep('complete');
      setIsProcessing(false);

      // コールバック実行
      options?.onSuccess?.(data);
    },

    onError: (error: Error) => {
      console.error('獣害通報作成エラー:', error);
      showErrorToast(
        error.message || '送信に失敗しました。もう一度お試しください。'
      );
      setIsProcessing(false);

      // コールバック実行
      options?.onError?.(error);
    },
  });
}

export default useLineVerifyReport;
