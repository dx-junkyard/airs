/**
 * ReportStatus値オブジェクト
 *
 * 通報ステータスの状態遷移ルールを内包する。
 */
class ReportStatus {
  static readonly WAITING = new ReportStatus('waiting');
  static readonly COMPLETED = new ReportStatus('completed');

  private static readonly VALID_STATUSES = ['waiting', 'completed'] as const;

  private static readonly JAPANESE_LABELS: Record<string, string> = {
    waiting: '確認待ち',
    completed: '確認完了',
  };

  private constructor(
    private readonly _value: 'waiting' | 'completed'
  ) {}

  /**
   * 文字列からReportStatus値オブジェクトを生成
   * @param value ステータス文字列
   * @returns ReportStatus値オブジェクト
   * @throws {Error} 不正なステータスの場合
   */
  static create(value: string): ReportStatus {
    if (!ReportStatus.isValid(value)) {
      throw new Error(
        `不正なステータスです: ${value}。有効な値: ${ReportStatus.VALID_STATUSES.join(', ')}`
      );
    }

    switch (value) {
      case 'waiting':
        return ReportStatus.WAITING;
      case 'completed':
        return ReportStatus.COMPLETED;
      default:
        throw new Error(`不正なステータスです: ${value}`);
    }
  }

  /**
   * 有効なステータス値かどうかを判定
   */
  private static isValid(
    value: string
  ): value is 'waiting' | 'completed' {
    return ReportStatus.VALID_STATUSES.includes(value as any);
  }

  /**
   * ステータスの文字列表現を取得
   */
  get value(): 'waiting' | 'completed' {
    return this._value;
  }

  /**
   * 日本語ラベルを取得
   */
  get label(): string {
    return ReportStatus.JAPANESE_LABELS[this._value];
  }

  /**
   * 確認待ちかどうか
   */
  get isWaiting(): boolean {
    return this._value === 'waiting';
  }

  /**
   * 確認完了かどうか
   */
  get isCompleted(): boolean {
    return this._value === 'completed';
  }

  /**
   * 指定されたステータスへの遷移が可能かどうか
   */
  canTransitionTo(nextStatus: ReportStatus): boolean {
    // 同じステータスへの遷移は常に許可
    if (this.equals(nextStatus)) {
      return true;
    }

    // waiting ↔ completed の双方向遷移を許可
    return true;
  }

  /**
   * 等価性の判定
   */
  equals(other: ReportStatus): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}

export default ReportStatus;
