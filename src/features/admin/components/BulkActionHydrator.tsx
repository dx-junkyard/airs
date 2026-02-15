'use client';

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import type { BulkActionDto } from '@/server/application/dtos/BulkActionDto';
import { latestBulkActionAtom } from '@/features/admin/atoms/bulkActionAtom';

/**
 * SSRで取得したBulkActionデータをJotai atomに注入するコンポーネント
 */
export default function BulkActionHydrator({
  data,
}: {
  data: BulkActionDto | null;
}) {
  const setLatestBulkAction = useSetAtom(latestBulkActionAtom);

  useEffect(() => {
    setLatestBulkAction(data);
  }, [data, setLatestBulkAction]);

  return null;
}
