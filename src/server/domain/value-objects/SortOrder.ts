/**
 * SortOrder値オブジェクト
 *
 * ソート順序を表現する値オブジェクト。
 */
class SortOrder {
  static readonly ASC = new SortOrder('asc');
  static readonly DESC = new SortOrder('desc');

  private static readonly VALID_ORDERS = ['asc', 'desc'] as const;

  private static readonly JAPANESE_LABELS: Record<string, string> = {
    asc: '通報日時の昇順',
    desc: '通報日時の降順',
  };

  private constructor(private readonly _value: 'asc' | 'desc') {}

  /**
   * 文字列からSortOrder値オブジェクトを生成
   * @param value ソート順文字列
   * @returns SortOrder値オブジェクト
   * @throws {Error} 不正なソート順の場合
   */
  static create(value: string): SortOrder {
    if (!SortOrder.isValid(value)) {
      throw new Error(
        `不正なソート順です: ${value}。有効な値: ${SortOrder.VALID_ORDERS.join(', ')}`
      );
    }

    switch (value) {
      case 'asc':
        return SortOrder.ASC;
      case 'desc':
        return SortOrder.DESC;
      default:
        throw new Error(`不正なソート順です: ${value}`);
    }
  }

  /**
   * 有効なソート順かどうかを判定
   */
  private static isValid(value: string): value is 'asc' | 'desc' {
    return SortOrder.VALID_ORDERS.includes(value as 'asc' | 'desc');
  }

  /**
   * ソート順の文字列表現を取得
   */
  get value(): 'asc' | 'desc' {
    return this._value;
  }

  /**
   * 日本語ラベルを取得
   */
  get label(): string {
    return SortOrder.JAPANESE_LABELS[this._value];
  }

  /**
   * 昇順かどうか
   */
  get isAsc(): boolean {
    return this._value === 'asc';
  }

  /**
   * 降順かどうか
   */
  get isDesc(): boolean {
    return this._value === 'desc';
  }

  /**
   * 等価性の判定
   */
  equals(other: SortOrder): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}

export default SortOrder;
