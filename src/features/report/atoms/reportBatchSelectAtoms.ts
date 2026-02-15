import { atom } from 'jotai';

/**
 * Report一括選択用Atoms
 *
 * 一括ステータス変更のための選択状態管理
 */

// 一括選択モード（オン/オフ）
export const batchSelectModeAtom = atom<boolean>(false);

// 選択されたレポートIDのセット
export const selectedReportIdsAtom = atom<Set<string>>(new Set<string>());

// 派生atom: 選択されたIDの配列
export const selectedReportIdsArrayAtom = atom((get) =>
  Array.from(get(selectedReportIdsAtom))
);

// 派生atom: 選択数
export const selectedCountAtom = atom((get) => get(selectedReportIdsAtom).size);

// 派生atom: 選択中かどうか
export const hasSelectionAtom = atom((get) => get(selectedReportIdsAtom).size > 0);

// アクションatom: 選択のトグル
export const toggleSelectionAtom = atom(null, (get, set, reportId: string) => {
  const currentSelection = get(selectedReportIdsAtom);
  const newSelection = new Set(currentSelection);

  if (newSelection.has(reportId)) {
    newSelection.delete(reportId);
  } else {
    newSelection.add(reportId);
  }

  set(selectedReportIdsAtom, newSelection);
});

// アクションatom: 全選択
export const selectAllAtom = atom(null, (get, set, reportIds: string[]) => {
  set(selectedReportIdsAtom, new Set(reportIds));
});

// アクションatom: 全解除
export const clearSelectionAtom = atom(null, (get, set) => {
  set(selectedReportIdsAtom, new Set<string>());
});

// アクションatom: 一括選択モードを終了（選択もクリア）
export const exitBatchModeAtom = atom(null, (get, set) => {
  set(batchSelectModeAtom, false);
  set(selectedReportIdsAtom, new Set<string>());
});
