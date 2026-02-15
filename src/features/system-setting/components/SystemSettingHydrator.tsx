'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/react/utils';
import type { SystemSettingValue } from '@/server/application/dtos/SystemSettingDto';
import { systemSettingAtom } from '@/features/system-setting/atoms/systemSettingAtom';

/**
 * SSRで取得したシステム設定をJotai atomに注入するコンポーネント
 */
export default function SystemSettingHydrator({
  setting,
}: {
  setting: SystemSettingValue;
}) {
  // 初回マウント時に同期的に初期値を注入
  useHydrateAtoms([[systemSettingAtom, setting]]);
  const setSystemSetting = useSetAtom(systemSettingAtom);

  // 設定更新後の再レンダリング時にatomを追従させる
  useEffect(() => {
    setSystemSetting(setting);
  }, [setting, setSystemSetting]);

  return null;
}
