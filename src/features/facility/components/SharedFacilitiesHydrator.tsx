'use client';

import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { sharedFacilitiesAtom } from '@/features/facility/atoms/sharedFacilitiesAtom';
import type { FacilityDto } from '@/server/application/dtos/FacilityDto';

/**
 * SSRで取得した共有施設データをJotai atomに注入するコンポーネント
 * レンダリングなし
 */
export default function SharedFacilitiesHydrator({
  facilities,
}: {
  facilities: FacilityDto[];
}) {
  const set = useSetAtom(sharedFacilitiesAtom);
  useEffect(() => {
    set(facilities);
  }, [facilities, set]);
  return null;
}
