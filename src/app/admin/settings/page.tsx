import { getSystemSetting } from '@/features/system-setting/actions';
import { getSelectedStaffIdFromCookie } from '@/features/staff/utils/staffCookie';
import { getLatestDataResetInfo } from '@/features/admin/actions';
import SystemSettingHydrator from '@/features/system-setting/components/SystemSettingHydrator';
import SystemSettingClient from './SystemSettingClient';

export const dynamic = 'force-dynamic';

export default async function SystemSettingPage() {
  const [setting, selectedStaffId, latestDataResetInfo] = await Promise.all([
    getSystemSetting(),
    getSelectedStaffIdFromCookie(),
    getLatestDataResetInfo(),
  ]);

  return (
    <>
      <SystemSettingHydrator setting={setting.value} />
      <SystemSettingClient
        setting={setting}
        selectedStaffId={selectedStaffId}
        latestDataResetInfo={latestDataResetInfo}
      />
    </>
  );
}
