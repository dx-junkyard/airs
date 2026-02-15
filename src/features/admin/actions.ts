'use server';

import DIContainer from '@/server/infrastructure/di/container';
import EnableDataResetUseCase from '@/server/application/use-cases/admin/EnableDataResetUseCase';
import CsvReportParser from '@/server/infrastructure/csv/CsvReportParser';
import type { BulkActionDto } from '@/server/application/dtos/BulkActionDto';
import type { AdminPasswordInfo } from '@/server/domain/repositories/IAdminPasswordRepository';
import { requireAdmin } from '@/features/common/utils/isAdmin';

/**
 * CSVヘッダーを検証する
 *
 * @returns エラーメッセージ。問題なければ null。
 */
export async function validateCsvHeader(
  csvText: string
): Promise<string | null> {
  try {
    const parser = new CsvReportParser();
    parser.parse(csvText);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : 'CSVの検証に失敗しました';
  }
}

/**
 * CSVファイルをストレージにアップロードし、URLを返す
 * IMAGE_STORAGE_PROVIDER に応じて Vercel Blob / GCS を自動切り替え
 */
export async function uploadCsv(formData: FormData): Promise<string> {
  requireAdmin();

  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('CSVファイルが指定されていません');
  }

  const imageRepository = DIContainer.getImageRepository();
  return imageRepository.upload(file, file.name);
}

/**
 * 指定actionKeyの最新BulkActionを取得する
 */
export async function getLatestBulkAction(
  actionKey: string
): Promise<BulkActionDto | null> {
  requireAdmin();

  const repository = DIContainer.getBulkActionRepository();
  const record = await repository.findLatestByActionKey(actionKey);

  if (!record) return null;

  return {
    id: record.id,
    actionKey: record.actionKey,
    status: record.status as BulkActionDto['status'],
    fileUrl: record.fileUrl,
    staffName: null,
    totalCount: record.totalCount,
    successCount: record.successCount,
    errorCount: record.errorCount,
    result: record.result as unknown as BulkActionDto['result'],
    errorMessage: record.errorMessage,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * 最新10件のBulkAction履歴を取得する
 */
export async function getBulkActionHistory(): Promise<BulkActionDto[]> {
  requireAdmin();

  const repository = DIContainer.getBulkActionRepository();
  const records = await repository.findRecent(10);

  return records.map((record) => ({
    id: record.id,
    actionKey: record.actionKey,
    status: record.status as BulkActionDto['status'],
    fileUrl: record.fileUrl,
    staffName: record.staff?.name ?? null,
    totalCount: record.totalCount,
    successCount: record.successCount,
    errorCount: record.errorCount,
    result: record.result as unknown as BulkActionDto['result'],
    errorMessage: record.errorMessage,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }));
}

/**
 * 実行中のBulkActionを強制終了する
 */
export async function cancelBulkAction(id: string): Promise<void> {
  requireAdmin();

  const repository = DIContainer.getBulkActionRepository();
  const record = await repository.findById(id);

  if (!record) {
    throw new Error('対象の一括操作が見つかりません');
  }

  if (record.status !== 'pending' && record.status !== 'processing') {
    throw new Error('実行中でない操作はキャンセルできません');
  }

  await repository.updateStatus(id, {
    status: 'failed',
    errorMessage: 'ユーザーにより中止されました',
  });
}

/**
 * データリセット用パスワードを生成・保存し、平文を返す
 */
export async function enableDataReset(staffId: string): Promise<string> {
  requireAdmin();

  const repository = DIContainer.getAdminPasswordRepository();
  const useCase = new EnableDataResetUseCase(repository);
  return await useCase.execute(staffId);
}

/**
 * 最新のパスワード登録者情報を取得する
 */
export async function getLatestDataResetInfo(): Promise<
  AdminPasswordInfo | undefined
> {
  const repository = DIContainer.getAdminPasswordRepository();
  return await repository.findLatestInfo();
}
