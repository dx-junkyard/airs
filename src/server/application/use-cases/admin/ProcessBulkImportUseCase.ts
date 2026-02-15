import type { IBulkActionRepository } from '@/server/domain/repositories/IBulkActionRepository';
import type { IDataResetRepository } from '@/server/domain/repositories/IDataResetRepository';
import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import type { IEventClusteringRepository } from '@/server/domain/repositories/IEventClusteringRepository';
import type { ISystemSettingRepository } from '@/server/domain/repositories/ISystemSettingRepository';
import type { BulkImportProgress } from '@/server/application/dtos/BulkActionDto';
import BulkImportReportsUseCase from '@/server/application/use-cases/admin/BulkImportReportsUseCase';

/**
 * ProcessBulkImportUseCase
 *
 * バックグラウンドで実行されるCSV一括インポート処理。
 * BulkActionレコードのステータスと result JSON を更新しながら進行する。
 */
class ProcessBulkImportUseCase {
  constructor(
    private bulkActionRepository: IBulkActionRepository,
    private dataResetRepository: IDataResetRepository,
    private reportRepository: IReportRepository,
    private clusteringRepository: IEventClusteringRepository,
    private settingRepository: ISystemSettingRepository
  ) {}

  async execute(
    bulkActionId: string,
    resetBeforeImport: boolean
  ): Promise<void> {
    try {
      // ステータスを processing に更新
      await this.bulkActionRepository.updateStatus(bulkActionId, {
        status: 'processing',
      });

      // BulkActionからファイルURLを取得
      const bulkAction =
        await this.bulkActionRepository.findById(bulkActionId);
      if (!bulkAction) {
        throw new Error(`BulkAction not found: ${bulkActionId}`);
      }

      // リセットフラグがONなら既存データを論理削除
      if (resetBeforeImport) {
        await this.dataResetRepository.softDeleteAll();
      }

      // CSVテキストを取得
      const response = await fetch(bulkAction.fileUrl);
      if (!response.ok) {
        throw new Error(
          `CSVファイルの取得に失敗しました: ${response.statusText}`
        );
      }
      const csvText = await response.text();

      // 進捗報告 + キャンセルチェック
      // result JSON に進捗を書き込み、返却値のステータスでキャンセル判定
      const onProgress = async (
        progress: BulkImportProgress
      ): Promise<boolean> => {
        const updated = await this.bulkActionRepository.updateStatus(
          bulkActionId,
          {
            totalCount: progress.importTotal,
            successCount: progress.importSuccess,
            errorCount: progress.importError,
            result: progress,
          }
        );
        return updated.status === 'processing';
      };

      // BulkImportReportsUseCaseで一括インポート実行
      const useCase = new BulkImportReportsUseCase(
        this.reportRepository,
        this.clusteringRepository,
        this.settingRepository
      );
      const result = await useCase.execute(csvText, onProgress);

      // キャンセルされていなければ完了ステータスに更新
      const current =
        await this.bulkActionRepository.findById(bulkActionId);
      if (current && current.status === 'processing') {
        await this.bulkActionRepository.updateStatus(bulkActionId, {
          status: 'completed',
          totalCount: result.importTotal,
          successCount: result.importSuccess,
          errorCount: result.importError,
          result,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '不明なエラーが発生しました';
      console.error('ProcessBulkImportUseCase error:', error);

      // キャンセルされていなければエラーステータスに更新
      const current =
        await this.bulkActionRepository.findById(bulkActionId);
      if (current && current.status === 'processing') {
        await this.bulkActionRepository.updateStatus(bulkActionId, {
          status: 'failed',
          errorMessage,
        });
      }
    }
  }
}

export default ProcessBulkImportUseCase;
