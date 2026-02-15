export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { getReports } from '@/features/report/actions';
import { getEnabledAnimalTypes } from '@/features/system-setting/actions';
import { getSystemSetting } from '@/features/system-setting/actions';
import { getStaffs } from '@/features/staff/actions';
import { getAllFacilities } from '@/features/facility/actions';
import { isAdminMode } from '@/config/admin-mode';
import MapPage from '@/features/map/components/MapPage';
import SharedFacilitiesHydrator from '@/features/facility/components/SharedFacilitiesHydrator';
import SystemSettingHydrator from '@/features/system-setting/components/SystemSettingHydrator';
import {
  DEFAULT_MAP_DEFAULT_DATA_RANGE,
  getMapDefaultDataRangeDateRange,
  isMapDefaultDataRangeValue,
} from '@/server/domain/constants/mapDefaultDataRange';


/**
 * 地図ページ（サーバーコンポーネント）
 * 全通報データと有効獣種を取得してMapPageに渡す
 */
const MapPageServer = async () => {
  const [enabledAnimalTypes, systemSetting, allFacilities, ...adminData] =
    await Promise.all([
      getEnabledAnimalTypes(),
      getSystemSetting(),
      getAllFacilities(),
      ...(isAdminMode ? [getStaffs()] : []),
    ]);

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
  const reports = await getReports(undefined, {
    startDate: defaultDateRange.startDate,
    endDate: defaultDateRange.endDate,
  });

  const staffs = isAdminMode ? adminData[0] : undefined;
  const suggestedQuestions: string[] = (() => {
    try {
      const parsed = JSON.parse(
        systemSetting.value.suggestedQuestionsJson ?? '[]'
      );
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
    return [];
  })();

  return (
    <Suspense
      fallback={
        <div className={`
          flex h-screen w-screen items-center justify-center bg-solid-gray-50
        `}>
          <div className="text-solid-gray-600">地図を読み込み中...</div>
        </div>
      }
    >
      <SharedFacilitiesHydrator facilities={allFacilities} />
      <SystemSettingHydrator setting={systemSetting.value} />
      <MapPage
        reports={reports}
        enabledAnimalTypes={enabledAnimalTypes}
        suggestedQuestions={suggestedQuestions}
        defaultCenter={{
          lat: systemSetting.value.mapDefaultLatitude,
          lng: systemSetting.value.mapDefaultLongitude,
        }}
        mapDefaultDataRange={mapDefaultDataRange}
        staffs={staffs}
      />
    </Suspense>
  );
};

export default MapPageServer;
