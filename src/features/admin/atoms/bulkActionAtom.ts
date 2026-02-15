import { atom } from 'jotai';
import type { BulkActionDto } from '@/server/application/dtos/BulkActionDto';

/**
 * SSRで取得した最新BulkActionをクライアント側で共有するatom
 * ポーリング結果の更新もこのatomに書き込む
 */
export const latestBulkActionAtom = atom<BulkActionDto | null>(null);

/**
 * 一括操作が実行中かどうかの派生atom
 */
export const isBulkActionRunningAtom = atom((get) => {
  const action = get(latestBulkActionAtom);
  return action?.status === 'pending' || action?.status === 'processing';
});
