/**
 * ReportId値オブジェクト
 *
 * 通報IDを表す値オブジェクト。
 */
class ReportId {
  private constructor(private readonly _value: string) {}

  /**
   * 既存の文字列からReportIdを生成
   * @param value ID文字列
   * @returns ReportId値オブジェクト
   * @throws {Error} 不正なIDの場合
   */
  static create(value: string): ReportId {
    if (!value || value.trim() === '') {
      throw new Error('IDは必須です');
    }
    return new ReportId(value.trim());
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
  equals(other: ReportId): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}

export default ReportId;
