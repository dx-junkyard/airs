import { atom } from 'jotai';
import type { StaffDto } from '@/server/application/dtos/StaffDto';

// 各フィールドを個別のatomで管理
export const editingStaffIdAtom = atom<string | null>(null);
export const nameAtom = atom<string>('');
export const emailAtom = atom<string>('');

// アクションatom: データからフォームを初期化
export const initFormFromStaffAtom = atom(
  null,
  (get, set, staff: StaffDto) => {
    set(editingStaffIdAtom, staff.id);
    set(nameAtom, staff.name);
    set(emailAtom, staff.email ?? '');
  }
);

// アクションatom: フォームをリセット
export const resetFormAtom = atom(null, (get, set) => {
  set(editingStaffIdAtom, null);
  set(nameAtom, '');
  set(emailAtom, '');
});
