'use client';

import { useSyncExternalStore } from 'react';

/**
 * メディアクエリの状態を監視するフック
 * @param query - メディアクエリ文字列（例: '(min-width: 1024px)'）
 * @returns マッチしているかどうか
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener('change', callback);
    return () => mediaQuery.removeEventListener('change', callback);
  };

  const getSnapshot = () => window.matchMedia(query).matches;

  // SSR時はfalseを返す
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * デスクトップ判定フック（lg: 1024px以上）
 * TailwindのlgブレークポイントでPC/スマホを判定
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
