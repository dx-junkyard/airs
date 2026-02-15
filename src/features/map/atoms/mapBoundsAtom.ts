import { atom } from 'jotai';

/**
 * 地図の現在の表示範囲（ビューポート）を管理するatom
 *
 * moveendイベントで更新され、データ一覧の範囲内フィルタリングに使用。
 * - south/west: 南西の座標
 * - north/east: 北東の座標
 */
export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export const mapBoundsAtom = atom<MapBounds | null>(null);

/**
 * 「地図の範囲内のみ表示」チェックボックスの状態を管理するatom
 * デフォルトはOFF（チェックボックス未選択）
 */
export const filterByBoundsAtom = atom<boolean>(false);
