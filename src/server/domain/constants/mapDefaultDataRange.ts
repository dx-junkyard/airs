/**
 * 地図ページで初期表示する通報データの期間プリセット
 */
export type MapDefaultDataRangeValue =
  | 'all'
  | 'past_2_years'
  | 'past_1_year'
  | 'past_6_months'
  | 'past_3_months'
  | 'past_1_month';

/**
 * 地図データ表示期間のデフォルト値
 */
export const DEFAULT_MAP_DEFAULT_DATA_RANGE: MapDefaultDataRangeValue =
  'past_1_year';

/**
 * 地図データ表示期間の選択肢
 */
export const MAP_DEFAULT_DATA_RANGE_OPTIONS: Array<{
  value: MapDefaultDataRangeValue;
  label: string;
}> = [
  { value: 'all', label: '全件（非推奨）' },
  { value: 'past_2_years', label: '過去2年' },
  { value: 'past_1_year', label: '過去1年（推奨）' },
  { value: 'past_6_months', label: '過去6ヶ月' },
  { value: 'past_3_months', label: '過去3ヶ月' },
  { value: 'past_1_month', label: '過去1ヶ月' },
];

/**
 * 値がMapDefaultDataRangeValueとして有効か判定する
 */
export const isMapDefaultDataRangeValue = (
  value: string
): value is MapDefaultDataRangeValue =>
  MAP_DEFAULT_DATA_RANGE_OPTIONS.some((option) => option.value === value);

/**
 * 期間プリセットから開始日時を算出する
 * `all` の場合は `undefined` を返す
 */
export const getMapDefaultDataRangeStartDate = (
  range: MapDefaultDataRangeValue,
  now: Date = new Date()
): Date | undefined => {
  const start = new Date(now);

  switch (range) {
    case 'all':
      return undefined;
    case 'past_2_years':
      start.setFullYear(start.getFullYear() - 2);
      return start;
    case 'past_1_year':
      start.setFullYear(start.getFullYear() - 1);
      return start;
    case 'past_6_months':
      start.setMonth(start.getMonth() - 6);
      return start;
    case 'past_3_months':
      start.setMonth(start.getMonth() - 3);
      return start;
    case 'past_1_month':
      start.setMonth(start.getMonth() - 1);
      return start;
    default:
      return undefined;
  }
};

const toDateInputValue = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * 期間プリセットから `YYYY-MM-DD` 形式の開始日・終了日を算出する
 * `all` の場合はどちらも `undefined` を返す
 */
export const getMapDefaultDataRangeDateRange = (
  range: MapDefaultDataRangeValue,
  now: Date = new Date(),
  endDate?: string,
): { startDate?: string; endDate?: string } => {
  const effectiveEnd = endDate ? new Date(endDate) : now;
  const start = getMapDefaultDataRangeStartDate(range, effectiveEnd);
  if (!start) return {};
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(effectiveEnd),
  };
};
