import { atom } from 'jotai';

/**
 * ホバー中の通報IDを管理するatom
 *
 * 地図上のマーカーとデータ一覧リストの双方向ハイライト連携に使用。
 * - リスト行にホバー → 対応するマーカーが強調表示
 * - マーカーにホバー → 対応するリスト行がハイライト
 */
export const hoveredReportIdAtom = atom<string | null>(null);
