import { atom } from 'jotai';
import type { SystemSettingValue } from '@/server/application/dtos/SystemSettingDto';
import { DEFAULT_MAP_DEFAULT_DATA_RANGE } from '@/server/domain/constants/mapDefaultDataRange';

/**
 * SSRで取得したシステム設定をクライアント側で共有するatom
 */
export const systemSettingAtom = atom<SystemSettingValue | null>(null);

/**
 * 地図デフォルト表示期間の参照用atom
 */
export const mapDefaultDataRangeFromSettingAtom = atom((get) => {
  const setting = get(systemSettingAtom);
  return setting?.mapDefaultDataRange ?? DEFAULT_MAP_DEFAULT_DATA_RANGE;
});

/**
 * 表示期間の終了日（未設定ならundefined = 今日）
 */
export const defaultDisplayEndDateAtom = atom((get) => {
  const setting = get(systemSettingAtom);
  return setting?.defaultDisplayEndDate ?? undefined;
});
