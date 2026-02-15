/**
 * StatisticsService
 *
 * エンティティの統計計算を行う汎用的なドメインサービス。
 * Inquiry、PhotoContentなど、様々なエンティティで再利用可能。
 */

/**
 * カウント結果の型
 */
export interface CountResult<T extends string = string> {
  [key: string]: number;
  total: number;
}

/**
 * 時系列データポイントの型
 */
export interface TimeSeriesDataPoint {
  date: string;
  count: number;
}

/**
 * 時間帯別獣種データポイントの型
 * 動的な獣種キーをサポート
 */
export interface HourlyAnimalDataPoint {
  hour: number;
  label: string;
  [key: string]: string | number;
}

/**
 * 時系列獣種別データポイントの型
 * 動的な獣種キーをサポート
 */
export interface TimeSeriesAnimalDataPoint {
  date: string;
  [key: string]: string | number;
}

class StatisticsService {
  /**
   * 指定されたキーでアイテムをグループ化してカウント
   * @param items アイテムの配列
   * @param keyExtractor キー抽出関数
   * @param validKeys 有効なキーのリスト
   * @returns カウント結果
   */
  static countByKey<T, K extends string>(
    items: T[],
    keyExtractor: (item: T) => K,
    validKeys: K[]
  ): CountResult<K> {
    const counts: any = {
      total: items.length,
    };

    // 初期化
    validKeys.forEach((key) => {
      counts[key] = 0;
    });

    // カウント
    items.forEach((item) => {
      const key = keyExtractor(item);
      if (validKeys.includes(key)) {
        counts[key]++;
      }
    });

    return counts;
  }

  /**
   * 時系列データを生成
   * 空白日付を0件で補完し、X軸が均等になるようにする
   * @param items アイテムの配列
   * @param dateExtractor 日時抽出関数
   * @param period 期間（daily, weekly, monthly）
   * @returns 時系列データポイントの配列
   */
  static generateTimeSeriesData<T>(
    items: T[],
    dateExtractor: (item: T) => Date,
    period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): TimeSeriesDataPoint[] {
    if (items.length === 0) {
      return [];
    }

    // 日付ごとにグループ化
    const dateMap = new Map<string, number>();

    items.forEach((item) => {
      const date = dateExtractor(item);
      const key = this.getDateKey(date, period);
      dateMap.set(key, (dateMap.get(key) || 0) + 1);
    });

    // 空白日付を0件で補完
    const allDateKeys = this.generateAllDateKeys(dateMap, period);

    // 全日付に対してデータポイントを生成（存在しない日付は0件）
    return allDateKeys.map((date) => ({
      date,
      count: dateMap.get(date) ?? 0,
    }));
  }

  /**
   * 期間に応じた日付キーを生成
   * @param date 日付
   * @param period 期間
   * @returns 日付キー
   */
  private static getDateKey(
    date: Date,
    period: 'daily' | 'weekly' | 'monthly'
  ): string {
    switch (period) {
      case 'daily':
        return this.formatLocalDate(date);

      case 'weekly': {
        // 週の月曜日を取得
        const weekStart = new Date(date);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        return this.formatLocalDate(weekStart);
      }

      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  /**
   * ローカルタイムゾーンでYYYY-MM-DD形式の文字列を返す
   * toISOString()はUTC変換されるため、ローカル日付と食い違う場合がある
   */
  private static formatLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 日付Mapから最小〜最大の全日付キーを生成する
   * 空白期間を補完してX軸を均等にするために使用
   * @param dateMap 日付キー→値のMap
   * @param period 期間（daily, weekly, monthly）
   * @returns ソート済みの全日付キー配列
   */
  private static generateAllDateKeys(
    dateMap: Map<string, unknown>,
    period: 'daily' | 'weekly' | 'monthly'
  ): string[] {
    const existingKeys = Array.from(dateMap.keys()).sort();
    if (existingKeys.length <= 1) {
      return existingKeys;
    }

    const firstKey = existingKeys[0];
    const lastKey = existingKeys[existingKeys.length - 1];

    const allKeys: string[] = [];
    const current = this.dateKeyToDate(firstKey, period);
    const end = this.dateKeyToDate(lastKey, period);

    while (current <= end) {
      allKeys.push(this.getDateKey(current, period));
      this.advanceDate(current, period);
    }

    return allKeys;
  }

  /**
   * 日付キー文字列をDateオブジェクトに変換
   * @param key 日付キー（YYYY-MM-DD or YYYY-MM）
   * @param period 期間
   * @returns Dateオブジェクト
   */
  private static dateKeyToDate(
    key: string,
    period: 'daily' | 'weekly' | 'monthly'
  ): Date {
    if (period === 'monthly') {
      // "YYYY-MM" 形式
      const [year, month] = key.split('-').map(Number);
      return new Date(year, month - 1, 1);
    }
    // "YYYY-MM-DD" 形式（daily, weekly共通）
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * 期間に応じて日付を1ステップ進める（破壊的操作）
   * @param date 進める日付
   * @param period 期間
   */
  private static advanceDate(
    date: Date,
    period: 'daily' | 'weekly' | 'monthly'
  ): void {
    switch (period) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
    }
  }

  /**
   * パーセンテージを計算
   * @param part 部分
   * @param total 全体
   * @param decimals 小数点以下の桁数（デフォルト: 2）
   * @returns パーセンテージ
   */
  static calculatePercentage(
    part: number,
    total: number,
    decimals: number = 2
  ): number {
    if (total === 0) return 0;
    return Number(((part / total) * 100).toFixed(decimals));
  }

  /**
   * 平均値を計算
   * @param values 値の配列
   * @returns 平均値
   */
  static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * 中央値を計算
   * @param values 値の配列
   * @returns 中央値
   */
  static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
  }

  /**
   * 時系列獣種別データを生成
   * 空白日付を0件で補完し、X軸が均等になるようにする
   * @param items アイテムの配列
   * @param dateExtractor 日時抽出関数
   * @param animalTypeExtractor 獣種抽出関数
   * @param period 期間（daily, weekly, monthly）
   * @returns 時系列獣種別データポイントの配列
   */
  static generateTimeSeriesAnimalData<T>(
    items: T[],
    dateExtractor: (item: T) => Date,
    animalTypeExtractor: (item: T) => string,
    period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): TimeSeriesAnimalDataPoint[] {
    if (items.length === 0) {
      return [];
    }

    // 全獣種キーを収集
    const allAnimalTypes = new Set<string>();

    // 日付ごとにグループ化（動的キー）
    const dateMap = new Map<string, Record<string, number>>();

    items.forEach((item) => {
      const date = dateExtractor(item);
      const key = this.getDateKey(date, period);
      const animalType = animalTypeExtractor(item);

      allAnimalTypes.add(animalType);

      if (!dateMap.has(key)) {
        dateMap.set(key, {});
      }

      const counts = dateMap.get(key)!;
      counts[animalType] = (counts[animalType] ?? 0) + 1;
    });

    // 空白日付を補完した全日付キーを取得
    const allDateKeys = this.generateAllDateKeys(dateMap, period);

    // 全日付に対してデータポイントを生成（存在しない日付は全獣種0件）
    const animalTypeKeys = Array.from(allAnimalTypes);
    return allDateKeys.map((date) => {
      const existing = dateMap.get(date) ?? {};
      const zeroed: Record<string, number> = {};
      animalTypeKeys.forEach((key) => {
        zeroed[key] = existing[key] ?? 0;
      });
      return { date, ...zeroed } as TimeSeriesAnimalDataPoint;
    });
  }

  /**
   * 時間帯別獣種データを生成
   * @param items アイテムの配列
   * @param dateExtractor 日時抽出関数
   * @param animalTypeExtractor 獣種抽出関数
   * @returns 時間帯別獣種データポイントの配列（0-23時）
   */
  static generateHourlyAnimalData<T>(
    items: T[],
    dateExtractor: (item: T) => Date,
    animalTypeExtractor: (item: T) => string
  ): HourlyAnimalDataPoint[] {
    // 0-23時の初期データを生成
    const hourlyData: HourlyAnimalDataPoint[] = Array.from(
      { length: 24 },
      (_, hour) => ({
        hour,
        label: `${String(hour).padStart(2, '0')}:00`,
      })
    );

    // 各アイテムを時間帯と獣種でカウント（動的キー）
    items.forEach((item) => {
      const date = dateExtractor(item);
      const hour = date.getHours();
      const animalType = animalTypeExtractor(item);

      const hourData = hourlyData[hour];
      hourData[animalType] = ((hourData[animalType] as number) ?? 0) + 1;
    });

    return hourlyData;
  }
}

export default StatisticsService;
