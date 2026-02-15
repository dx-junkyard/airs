/**
 * StaffName値オブジェクト
 *
 * 職員名を表す値オブジェクト。
 * - 必須（空文字不可）
 * - 最大100文字
 * - トリム処理
 */
class StaffName {
  private static readonly MAX_LENGTH = 100;

  private constructor(private readonly _value: string) {}

  /**
   * 文字列からStaffNameを生成
   * @param value 職員名
   * @returns StaffName値オブジェクト
   * @throws {Error} バリデーションエラーの場合
   */
  static create(value: string): StaffName {
    const trimmed = value?.trim() ?? '';

    if (!trimmed) {
      throw new Error('職員名は必須です');
    }

    if (trimmed.length > this.MAX_LENGTH) {
      throw new Error(`職員名は${this.MAX_LENGTH}文字以内で入力してください`);
    }

    return new StaffName(trimmed);
  }

  /**
   * 職員名の文字列表現を取得
   */
  get value(): string {
    return this._value;
  }

  /**
   * 等価性の判定
   */
  equals(other: StaffName): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}

export default StaffName;
