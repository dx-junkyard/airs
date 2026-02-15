/**
 * DateRange値オブジェクト
 *
 * 日付範囲のバリデーションロジックを内包する。
 * 開始日と終了日の関係を保証する。
 */
class DateRange {
  private constructor(
    private readonly _start: Date,
    private readonly _end: Date
  ) {}

  /**
   * 開始日と終了日からDateRange値オブジェクトを生成
   * @param start 開始日
   * @param end 終了日
   * @returns DateRange値オブジェクト
   * @throws {Error} 終了日が開始日より前の場合
   */
  static create(start: Date, end: Date): DateRange {
    if (start > end) {
      throw new Error('終了日は開始日より後である必要があります');
    }

    return new DateRange(start, end);
  }

  /**
   * 開始日を取得
   */
  get start(): Date {
    return new Date(this._start);
  }

  /**
   * 終了日を取得
   */
  get end(): Date {
    return new Date(this._end);
  }

  /**
   * 範囲内の日数を取得
   */
  get daysCount(): number {
    const diffTime = Math.abs(this._end.getTime() - this._start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 指定された日付が範囲内かどうかを判定
   */
  contains(date: Date): boolean {
    return date >= this._start && date <= this._end;
  }

  /**
   * 等価性の判定
   */
  equals(other: DateRange): boolean {
    return (
      this._start.getTime() === other._start.getTime() &&
      this._end.getTime() === other._end.getTime()
    );
  }
}

export default DateRange;
