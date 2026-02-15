/**
 * StaffEmail値オブジェクト
 *
 * 職員メールアドレスを表す値オブジェクト。
 * - 任意項目（nullを許容）
 * - メールアドレス形式のバリデーション
 * - 最大254文字（RFC 5321準拠）
 * - トリム処理
 */
class StaffEmail {
  private static readonly MAX_LENGTH = 254;
  private static readonly EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(private readonly _value: string) {}

  /**
   * 文字列からStaffEmailを生成
   * @param value メールアドレス
   * @returns StaffEmail値オブジェクト
   * @throws {Error} バリデーションエラーの場合
   */
  static create(value: string): StaffEmail {
    const trimmed = value?.trim() ?? '';

    if (!trimmed) {
      throw new Error('メールアドレスが空です');
    }

    if (trimmed.length > this.MAX_LENGTH) {
      throw new Error(
        `メールアドレスは${this.MAX_LENGTH}文字以内で入力してください`
      );
    }

    if (!this.EMAIL_PATTERN.test(trimmed)) {
      throw new Error('有効なメールアドレスを入力してください');
    }

    return new StaffEmail(trimmed);
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
  equals(other: StaffEmail): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}

export default StaffEmail;
