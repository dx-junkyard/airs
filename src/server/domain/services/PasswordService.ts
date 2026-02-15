import crypto from 'crypto';

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const PASSWORD_LENGTH = 4;

/**
 * PasswordService
 *
 * データリセット用の使い捨て確認コードの生成・ハッシュ・検証を担うドメインサービス。
 * - 4文字の[A-Z0-9]混合コードを生成
 * - SHA-256でハッシュ化
 * - crypto.timingSafeEqualで安全に比較
 */
class PasswordService {
  /**
   * ランダムパスワードを生成する (4文字、英大文字+数字)
   */
  generate(): string {
    const bytes = crypto.randomBytes(PASSWORD_LENGTH);
    return Array.from(bytes)
      .map((b) => CHARSET[b % CHARSET.length])
      .join('');
  }

  /**
   * パスワードをSHA-256でハッシュ化する
   */
  hash(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * パスワードをタイミング安全に検証する
   */
  verify(password: string, hashedPassword: string): boolean {
    const candidateHash = this.hash(password);
    const candidateBuffer = Buffer.from(candidateHash, 'hex');
    const storedBuffer = Buffer.from(hashedPassword, 'hex');

    if (candidateBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(candidateBuffer, storedBuffer);
  }
}

export default PasswordService;
