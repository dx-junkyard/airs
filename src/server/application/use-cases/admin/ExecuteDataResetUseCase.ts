import type { IAdminPasswordRepository } from '@/server/domain/repositories/IAdminPasswordRepository';
import type { IDataResetRepository } from '@/server/domain/repositories/IDataResetRepository';
import PasswordService from '@/server/domain/services/PasswordService';

/**
 * データリセット実行結果
 */
export interface DataResetResult {
  reportsCount: number;
  eventsCount: number;
  eventReportsCount: number;
}

/**
 * ExecuteDataResetUseCase
 *
 * パスワードを検証し、一致した場合にデータを一括soft-deleteする。
 */
class ExecuteDataResetUseCase {
  private passwordService = new PasswordService();

  constructor(
    private adminPasswordRepository: IAdminPasswordRepository,
    private dataResetRepository: IDataResetRepository
  ) {}

  async execute(password: string): Promise<DataResetResult> {
    // 最新のパスワードハッシュを取得
    const storedHash = await this.adminPasswordRepository.findLatest();
    if (!storedHash) {
      throw new Error('リセットが有効化されていません');
    }

    // パスワード検証
    const isValid = this.passwordService.verify(password, storedHash);
    if (!isValid) {
      throw new Error('パスワードが正しくありません');
    }

    // 一括soft-delete実行
    return await this.dataResetRepository.softDeleteAll();
  }
}

export default ExecuteDataResetUseCase;
