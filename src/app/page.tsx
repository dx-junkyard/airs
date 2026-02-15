export const dynamic = 'force-dynamic';

import StatisticsDashboard from '@/features/dashboard/components/StatisticsDashboard';
import { getReportStatistics } from '@/features/report/actions';
import { getRecentEvents } from '@/features/event/actions';
import {
  getEnabledAnimalTypes,
  getSystemSetting,
} from '@/features/system-setting/actions';
import SystemSettingHydrator from '@/features/system-setting/components/SystemSettingHydrator';
import {
  getMapDefaultDataRangeDateRange,
  isMapDefaultDataRangeValue,
  DEFAULT_MAP_DEFAULT_DATA_RANGE,
} from '@/server/domain/constants/mapDefaultDataRange';


interface HomeProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;

  const [enabledAnimalTypes, systemSetting] = await Promise.all([
    getEnabledAnimalTypes(),
    getSystemSetting(),
  ]);

  // システム設定からデフォルト期間を算出
  const mapDefaultDataRange = isMapDefaultDataRangeValue(
    String(systemSetting.value.mapDefaultDataRange)
  )
    ? systemSetting.value.mapDefaultDataRange
    : DEFAULT_MAP_DEFAULT_DATA_RANGE;
  const defaultDateRange = getMapDefaultDataRangeDateRange(
    mapDefaultDataRange,
    new Date(),
    systemSetting.value.defaultDisplayEndDate,
  );

  // URLパラメータがなければシステム設定のデフォルト期間を使用
  const startDate =
    params.startDate ?? defaultDateRange.startDate ?? new Date().toISOString().split('T')[0];
  const endDate =
    params.endDate ?? defaultDateRange.endDate ?? new Date().toISOString().split('T')[0];

  // SSR時にデータを取得
  const [statistics, recentEvents] = await Promise.all([
    getReportStatistics({ startDate, endDate }),
    getRecentEvents(),
  ]);

  const enabledAnimalTypeIds = enabledAnimalTypes.map((t) => t.id);

  return (
    <>
      <SystemSettingHydrator setting={systemSetting.value} />
      <StatisticsDashboard
        statistics={statistics}
        recentEvents={recentEvents}
        enabledAnimalTypeIds={enabledAnimalTypeIds}
        startDate={startDate}
        endDate={endDate}
      />
    </>
  );
}
