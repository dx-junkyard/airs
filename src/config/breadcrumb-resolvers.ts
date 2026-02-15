import { getStaff } from '@/features/staff/actions';

/**
 * パス名からパンくずのセグメント上書きをサーバーサイドで解決する
 */
export async function resolveBreadcrumbOverrides(
  pathname: string
): Promise<Record<string, string>> {
  const overrides: Record<string, string> = {};

  // /admin/staff/[id] → 職員名で上書き
  const staffMatch = pathname.match(/^\/admin\/staff\/([^/]+)$/);
  if (staffMatch && staffMatch[1] !== 'new') {
    const staff = await getStaff(staffMatch[1]);
    if (staff) {
      overrides[staffMatch[1]] = staff.name;
    }
  }

  return overrides;
}
