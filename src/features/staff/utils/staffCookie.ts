import { cookies } from 'next/headers';

export const STAFF_COOKIE_NAME = 'selectedStaffId';
export const STAFF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30日

/**
 * cookieから選択中の職員IDを取得（サーバーサイド用）
 */
export async function getSelectedStaffIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(STAFF_COOKIE_NAME)?.value ?? null;
}
