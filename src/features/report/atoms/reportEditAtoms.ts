import { atom } from 'jotai';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import type { ReportImage } from '@/server/domain/value-objects/ImageUrls';

/**
 * Report編集フォーム用Atoms
 *
 * 編集モードのフォーム状態をJotaiで一元管理
 */

// 編集中のレポートID
export const editingReportIdAtom = atom<string | null>(null);

// ジオフェンスエラー
export const geofenceErrorAtom = atom<string | null>(null);

// フォームフィールド
export const animalTypeAtom = atom<string>('');
export const addressAtom = atom<string>('');
export const phoneNumberAtom = atom<string>('');
export const latitudeAtom = atom<string>('');
export const longitudeAtom = atom<string>('');
export const imagesAtom = atom<ReportImage[]>([]);
export const descriptionAtom = atom<string>('');
export const statusAtom = atom<string>('waiting');
export const staffIdAtom = atom<string>('');

// 派生atom: 画像URL配列（後方互換性・ImageUploader用）
export const imageUrlsAtom = atom(
  (get) => get(imagesAtom).map((img) => img.url),
  (_get, set, urls: string[]) => {
    // URLのみ更新: 既存の説明文を保持しつつ、URLリストに合わせる
    const currentImages = _get(imagesAtom);
    const newImages = urls.map((url, i) => ({
      url,
      description: currentImages[i]?.description || '',
    }));
    set(imagesAtom, newImages);
  }
);

// 派生atom: すべてのフォームデータ
export const formDataAtom = atom((get) => ({
  animalType: get(animalTypeAtom),
  address: get(addressAtom),
  phoneNumber: get(phoneNumberAtom),
  latitude: get(latitudeAtom),
  longitude: get(longitudeAtom),
  images: get(imagesAtom),
  description: get(descriptionAtom),
  status: get(statusAtom),
}));

// アクションatom: レポートからフォームを初期化
export const initFormFromReportAtom = atom(
  null,
  (get, set, report: ReportDto) => {
    set(editingReportIdAtom, report.id);
    set(geofenceErrorAtom, null);
    set(animalTypeAtom, report.animalType);
    set(addressAtom, report.address);
    set(phoneNumberAtom, report.phoneNumber || '');
    set(latitudeAtom, report.latitude.toString());
    set(longitudeAtom, report.longitude.toString());
    set(imagesAtom, [...report.images]);
    set(descriptionAtom, report.description || '');
    set(statusAtom, report.status);
    set(staffIdAtom, report.staffId || '');
  }
);

// アクションatom: フォームをリセット
export const resetFormAtom = atom(null, (get, set) => {
  set(editingReportIdAtom, null);
  set(geofenceErrorAtom, null);
  set(animalTypeAtom, '');
  set(addressAtom, '');
  set(phoneNumberAtom, '');
  set(latitudeAtom, '');
  set(longitudeAtom, '');
  set(imagesAtom, []);
  set(descriptionAtom, '');
  set(statusAtom, 'waiting');
  set(staffIdAtom, '');
});
