import type { BulkAction } from '@prisma/client';

/**
 * BulkActionの更新データ型
 */
export interface BulkActionUpdateData {
  status?: string;
  totalCount?: number;
  successCount?: number;
  errorCount?: number;
  result?: any;
  errorMessage?: string;
}

/**
 * BulkActionリポジトリのインターフェース
 *
 * 一括操作のステータス管理を抽象化する。
 */
export interface IBulkActionRepository {
  create(data: {
    actionKey: string;
    fileUrl: string;
    staffId?: string;
  }): Promise<BulkAction>;
  findById(id: string): Promise<BulkAction | null>;
  findLatestByActionKey(actionKey: string): Promise<BulkAction | null>;
  findRecent(
    limit: number
  ): Promise<Array<BulkAction & { staff: { id: string; name: string } | null }>>;
  updateStatus(id: string, data: BulkActionUpdateData): Promise<BulkAction>;
}
