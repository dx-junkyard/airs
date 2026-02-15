import { getSelectedStaffIdFromCookie } from '@/features/staff/utils/staffCookie';
import { getStaff } from '@/features/staff/actions';
import { getFacilitiesByStaff } from '@/features/facility/actions';
import { getSystemSetting } from '@/features/system-setting/actions';
import SystemSettingHydrator from '@/features/system-setting/components/SystemSettingHydrator';
import FacilityManagementClient from './FacilityManagementClient';

export const dynamic = 'force-dynamic';

/**
 * 周辺施設管理ページ（SSR）
 *
 * cookieから選択中の職員IDを取得し、その職員の施設データをSSRで取得する。
 */
export default async function FacilityManagementPage() {
  const [staffId, systemSetting] = await Promise.all([
    getSelectedStaffIdFromCookie(),
    getSystemSetting(),
  ]);

  // 職員データと施設データを取得（職員選択済みの場合のみ）
  const [staff, facilities] = staffId
    ? await Promise.all([getStaff(staffId), getFacilitiesByStaff(staffId)])
    : [null, []];

  const defaultCenter = {
    lat: systemSetting.value.mapDefaultLatitude,
    lng: systemSetting.value.mapDefaultLongitude,
  };

  return (
    <>
      <SystemSettingHydrator setting={systemSetting.value} />
      <FacilityManagementClient
        staffId={staffId}
        staffName={staff?.name ?? null}
        facilities={facilities}
        defaultCenter={defaultCenter}
      />
    </>
  );
}
