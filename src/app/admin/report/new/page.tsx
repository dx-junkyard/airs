export const dynamic = 'force-dynamic';

import {
  getEnabledAnimalTypes,
  getSystemSetting,
} from '@/features/system-setting/actions';
import SystemSettingHydrator from '@/features/system-setting/components/SystemSettingHydrator';
import { getSharedFacilities } from '@/features/facility/actions';
import SharedFacilitiesHydrator from '@/features/facility/components/SharedFacilitiesHydrator';
import NewReportClient from './NewReportClient';

export default async function NewReportPage() {
  const [enabledAnimalTypes, systemSetting, sharedFacilities] = await Promise.all([
    getEnabledAnimalTypes(),
    getSystemSetting(),
    getSharedFacilities(),
  ]);

  const defaultCenter = {
    latitude: systemSetting.value.mapDefaultLatitude,
    longitude: systemSetting.value.mapDefaultLongitude,
  };

  return (
    <>
      <SharedFacilitiesHydrator facilities={sharedFacilities} />
      <SystemSettingHydrator setting={systemSetting.value} />
      <NewReportClient
        enabledAnimalTypes={enabledAnimalTypes}
        defaultCenter={defaultCenter}
      />
    </>
  );
}
