import { atom } from 'jotai';

/**
 * パンくずラベル上書き用atom
 *
 * クライアントサイドナビゲーション時にページコンポーネントから
 * パンくずのセグメントラベルを上書きする。
 * SSR初回ロードはlayout.tsxのpropsで解決し、
 * 画面遷移時はこのatomで補完する。
 */
export const breadcrumbOverridesAtom = atom<Record<string, string>>({});
