/**
 * Email値オブジェクト
 *
 * メールアドレスのバリデーションロジックを内包し、
 * 不正なメールアドレスの生成を防ぐ。
 */
class Email {
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  private constructor(private readonly _value: string) {}

  /**
   * メールアドレス文字列からEmail値オブジェクトを生成
   * @param value メールアドレス文字列
   * @returns Email値オブジェクト
   * @throws {Error} 不正なメールアドレス形式の場合
   */
  static create(value: string): Email {
    if (!value || value.trim() === '') {
      throw new Error('メールアドレスは必須です');
    }

    if (!Email.EMAIL_REGEX.test(value.trim())) {
      throw new Error('メールアドレスの形式が正しくありません');
    }

    return new Email(value.trim());
  }

  /**
   * メールアドレスの文字列表現を取得
   */
  get value(): string {
    return this._value;
  }

  /**
   * 等価性の判定
   */
  equals(other: Email): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}

export default Email;
