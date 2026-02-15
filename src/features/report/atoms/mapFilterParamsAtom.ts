import { atom } from 'jotai';

/**
 * 地図遷移時に引き継ぐフィルタのクエリパラメータ文字列
 *
 * ReportDashboardでフィルタ状態から生成し、ReportListItemで参照する。
 */
export const mapFilterParamsAtom = atom('');
