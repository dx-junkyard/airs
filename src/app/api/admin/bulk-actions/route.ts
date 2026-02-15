import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { BulkAction } from '@prisma/client';
import DIContainer from '@/server/infrastructure/di/container';
import ProcessBulkImportUseCase from '@/server/application/use-cases/admin/ProcessBulkImportUseCase';
import PasswordService from '@/server/domain/services/PasswordService';
import type { BulkActionDto } from '@/server/application/dtos/BulkActionDto';
import { requireAdmin } from '@/features/common/utils/isAdmin';
import { STAFF_COOKIE_NAME } from '@/features/staff/utils/staffCookie';

export const maxDuration = 300;

function toBulkActionDto(record: BulkAction): BulkActionDto {
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
 * POST /api/admin/bulk-actions
 *
 * CSVインポートを非同期で開始する。
 * BulkActionレコードを作成し、バックグラウンドで処理を開始する。
 */
export async function POST(request: Request) {
  try {
    requireAdmin();

    const body = await request.json();
    const { fileUrl, actionKey, resetBeforeImport, resetPassword } = body as {
      fileUrl: string;
      actionKey: string;
      resetBeforeImport: boolean;
      resetPassword?: string;
    };

    if (!fileUrl || !actionKey) {
      return NextResponse.json(
        { error: 'fileUrl and actionKey are required' },
        { status: 400 }
      );
    }

    // リセット時のパスワード検証
    if (resetBeforeImport) {
      if (!resetPassword) {
        return NextResponse.json(
          { error: '確認コードを入力してください' },
          { status: 400 }
        );
      }

      const storedHash = await DIContainer.getAdminPasswordRepository().findLatest();
      if (!storedHash) {
        return NextResponse.json(
          { error: 'リセットが有効化されていません' },
          { status: 400 }
        );
      }

      const passwordService = new PasswordService();
      if (!passwordService.verify(resetPassword, storedHash)) {
        return NextResponse.json(
          { error: 'パスワードが正しくありません' },
          { status: 400 }
        );
      }
    }

    // cookieから実行者のstaffIdを取得
    const cookieStore = await cookies();
    const staffId = cookieStore.get(STAFF_COOKIE_NAME)?.value ?? undefined;

    const bulkActionRepository = DIContainer.getBulkActionRepository();

    // BulkActionレコード作成
    const bulkAction = await bulkActionRepository.create({
      actionKey,
      fileUrl,
      staffId,
    });

    // バックグラウンドでインポート処理を開始（fire-and-forget）
    const useCase = new ProcessBulkImportUseCase(
      bulkActionRepository,
      DIContainer.getDataResetRepository(),
      DIContainer.getReportRepository(),
      DIContainer.getEventClusteringRepository(),
      DIContainer.getSystemSettingRepository()
    );

    useCase.execute(bulkAction.id, resetBeforeImport).catch((error) => {
      console.error('Background bulk import failed:', error);
    });

    return NextResponse.json(toBulkActionDto(bulkAction));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
