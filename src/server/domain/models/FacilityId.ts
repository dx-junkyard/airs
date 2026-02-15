/**
 * FacilityId値オブジェクト
 *
 * 周辺施設のIDを表す値オブジェクト。
 */
class FacilityId {
  private constructor(private readonly _value: string) {}

  /**
   * 既存の文字列からFacilityIdを生成
   * @param value ID文字列
   * @returns FacilityId値オブジェクト
   * @throws {Error} 不正なIDの場合
   */
  static create(value: string): FacilityId {
    if (!value || value.trim() === '') {
      throw new Error('IDは必須です');
    }
    return new FacilityId(value.trim());
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
  equals(other: FacilityId): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}

export default FacilityId;
