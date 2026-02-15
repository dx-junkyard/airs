import type { IAdminPasswordRepository } from '@/server/domain/repositories/IAdminPasswordRepository';
import PasswordService from '@/server/domain/services/PasswordService';

/**
 * EnableDataResetUseCase
 *
 * データリセット有効化ユースケース。
 * パスワードを生成し、ハッシュを保存し、平文を返す。
 */
class EnableDataResetUseCase {
  private passwordService = new PasswordService();

  constructor(
    private adminPasswordRepository: IAdminPasswordRepository
  ) {}

  async execute(staffId: string): Promise<string> {
    const plainPassword = this.passwordService.generate();
    const hashedPassword = this.passwordService.hash(plainPassword);

    await this.adminPasswordRepository.create(hashedPassword, staffId);

    return plainPassword;
  }
}

export default EnableDataResetUseCase;
