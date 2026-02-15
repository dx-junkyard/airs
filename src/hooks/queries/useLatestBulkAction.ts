'use client';

import { useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getLatestBulkAction } from '@/features/admin/actions';
import {
  latestBulkActionAtom,
  isBulkActionRunningAtom,
} from '@/features/admin/atoms/bulkActionAtom';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';

/**
 * 最新のBulkActionをポーリングで取得し、atomに同期するフック
 *
 * SSRで取得した初期値はBulkActionHydratorでatomに注入済み。
 * このフックはatomの値を initialData として使い、
 * ポーリング結果をatomに書き戻す。
 * アクション完了時にrouter.refresh()でSSRを再実行し、履歴を更新する。
 */
function useLatestBulkAction(actionKey: string, enabled = true) {
  const initialData = useAtomValue(latestBulkActionAtom);
  const isRunning = useAtomValue(isBulkActionRunningAtom);
  const setLatestBulkAction = useSetAtom(latestBulkActionAtom);
  const router = useRouter();
  const wasRunningRef = useRef(isRunning);

  const query = useQuery({
    queryKey: queryKeys.bulkActions.latest(actionKey),
    enabled,
    initialData: initialData ?? undefined,
    queryFn: () => getLatestBulkAction(actionKey),
    refetchInterval: isRunning ? 3000 : false,
  });

  // ポーリング結果をatomに書き戻す
  useEffect(() => {
    if (query.data !== undefined) {
      setLatestBulkAction(query.data);
    }
  }, [query.data, setLatestBulkAction]);

  // running → 非running に遷移した時、SSRを再実行して履歴を更新
  useEffect(() => {
    if (wasRunningRef.current && !isRunning) {
      router.refresh();
    }
    wasRunningRef.current = isRunning;
  }, [isRunning, router]);

  return query;
}

export default useLatestBulkAction;
