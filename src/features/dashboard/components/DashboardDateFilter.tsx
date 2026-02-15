'use client';

import { useEffect, useMemo } from 'react';
import { useQueryStates, parseAsString } from 'nuqs';
import { useAtomValue } from 'jotai';
import {
  parseDate,
  getLocalTimeZone,
  today,
  type DateDuration,
} from '@internationalized/date';
import type { DateValue, RangeValue } from 'react-aria-components';
import DateRangePicker from '@/components/ui/DateRangePicker/DateRangePicker';
import {
  mapDefaultDataRangeFromSettingAtom,
  defaultDisplayEndDateAtom,
} from '@/features/system-setting/atoms/systemSettingAtom';
import { getMapDefaultDataRangeDateRange } from '@/server/domain/constants/mapDefaultDataRange';

/**
 * プリセット期間の定義
 */
interface DatePreset {
  /** 表示ラベル */
  label: string;
  /** 基準終了日から遡る期間 */
  duration: DateDuration;
}

const DATE_PRESETS: DatePreset[] = [
  { label: '1週間', duration: { weeks: 1 } },
  { label: '1ヶ月', duration: { months: 1 } },
  { label: '3ヶ月', duration: { months: 3 } },
  { label: '6ヶ月', duration: { months: 6 } },
  { label: '1年', duration: { years: 1 } },
];

/**
 * プリセットが現在の日付範囲と一致するか判定
 */
function isPresetActive(
  preset: DatePreset,
  startDate: string,
  endDate: string,
  presetBaseEndDate: string
): boolean {
  const baseEnd = parseDate(presetBaseEndDate);
  const expectedStart = baseEnd.subtract(preset.duration);
  return startDate === expectedStart.toString() && endDate === baseEnd.toString();
}

/**
 * ダッシュボード用日付フィルター
 *
 * URLパラメータで日付範囲を管理し、デフォルトは直近1ヶ月。
 * プリセットボタンで頻出期間をワンタップ選択可能。
 */
export default function DashboardDateFilter() {
  const mapDefaultDataRange = useAtomValue(mapDefaultDataRangeFromSettingAtom);
  const displayEndDate = useAtomValue(defaultDisplayEndDateAtom);
  const todayDate = today(getLocalTimeZone());

  // システム設定からデフォルト期間を算出
  const settingDateRange = useMemo(
    () => getMapDefaultDataRangeDateRange(mapDefaultDataRange, new Date(), displayEndDate),
    [mapDefaultDataRange, displayEndDate]
  );

  const getDefaultDateRange = useMemo(
    () => (): { startDate: string; endDate: string } => {
      return {
        startDate:
          settingDateRange.startDate ??
          todayDate.subtract({ months: 1 }).toString(),
        endDate: settingDateRange.endDate ?? todayDate.toString(),
      };
    },
    [settingDateRange, todayDate]
  );

  // プリセットボタンはシステム設定の終了日（未設定なら今日）を基準にする
  const presetBaseEndDate = displayEndDate ?? todayDate.toString();

  const [params, setParams] = useQueryStates(
    {
      startDate: parseAsString.withDefault(''),
      endDate: parseAsString.withDefault(''),
    },
    {
      history: 'push',
      shallow: true,
    }
  );

  // 初回マウント時にデフォルト値をURLに設定
  useEffect(() => {
    if (!params.startDate || !params.endDate) {
      const defaults = getDefaultDateRange();
      setParams(defaults, { history: 'replace' });
    }
  }, [
    params.startDate,
    params.endDate,
    getDefaultDateRange,
    setParams,
  ]);

  // URL パラメータから DateValue に変換（デフォルト値を考慮）
  const effectiveStartDate =
    params.startDate || getDefaultDateRange().startDate;
  const effectiveEndDate = params.endDate || getDefaultDateRange().endDate;

  const dateRangeValue: RangeValue<DateValue> = {
    start: parseDate(effectiveStartDate),
    end: parseDate(effectiveEndDate),
  };

  // DateRangePicker の変更ハンドラ
  const handleDateRangeChange = (value: RangeValue<DateValue> | null) => {
    if (value) {
      setParams({
        startDate: value.start.toString(),
        endDate: value.end.toString(),
      });
    } else {
      // クリア時はシステム設定のデフォルト期間に戻す
      const defaults = getDefaultDateRange();
      setParams(defaults);
    }
  };

  // プリセットボタンのクリックハンドラ
  const handlePresetClick = (preset: DatePreset) => {
    const baseEnd = parseDate(presetBaseEndDate);
    const start = baseEnd.subtract(preset.duration);
    setParams({
      startDate: start.toString(),
      endDate: baseEnd.toString(),
    });
  };

  return (
    <div
      className={`
        flex flex-col items-end gap-3
        sm:flex-row sm:items-center sm:gap-4
      `}
    >
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-solid-gray-700">期間:</span>
        <DateRangePicker
          aria-label="統計期間"
          value={dateRangeValue}
          onChange={handleDateRangeChange}
        />
      </div>
      <div className="flex items-center gap-2" role="group" aria-label="期間プリセット">
        {DATE_PRESETS.map((preset) => {
          const active = isPresetActive(
            preset,
            effectiveStartDate,
            effectiveEndDate,
            presetBaseEndDate
          );
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePresetClick(preset)}
              aria-pressed={active}
              className={`
                rounded-full border px-3 py-1 text-xs font-medium
                transition-colors
                ${
                  active
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : `
                      border-solid-gray-400 bg-white text-solid-gray-700
                      hover:border-solid-gray-600 hover:bg-solid-gray-50
                    `
                }
              `}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
