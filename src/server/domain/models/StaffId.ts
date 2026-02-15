/**
 * StaffId値オブジェクト
 *
 * 職員IDを表す値オブジェクト。
 */
class StaffId {
  private constructor(private readonly _value: string) {}

  /**
   * 既存の文字列からStaffIdを生成
   * @param value ID文字列
   * @returns StaffId値オブジェクト
   * @throws {Error} 不正なIDの場合
   */
  static create(value: string): StaffId {
    if (!value || value.trim() === '') {
      throw new Error('IDは必須です');
    }
    return new StaffId(value.trim());
  }

  /**
   * IDの文字列表現を取得
   */
  get value(): string {
    return this._value;
  }

  /**
   * 等価性の判定
   */
  equals(other: StaffId): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}

export default StaffId;
