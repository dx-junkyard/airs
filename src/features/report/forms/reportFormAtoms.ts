import { createFormAtoms } from '@/hooks/forms/core/createFormAtoms';
import type { FormSchema, FormValues } from '@/hooks/forms/core/types';
import { rules } from '@/hooks/forms/core/validation';
import { VALID_ANIMAL_TYPES } from '@/server/domain/constants/animalTypes';

/**
 * Reportフォームの値型
 */
export interface ReportFormValues extends FormValues {
  animalType: string;
  latitude: string;
  longitude: string;
  address: string;
  phoneNumber: string;
  imageUrls: string;
  description: string;
}

/**
 * Reportフォームスキーマ
 */
const reportFormSchema: FormSchema<ReportFormValues> = {
  animalType: {
    name: 'animalType',
    defaultValue: '',
    rules: [
      rules.required('獣種は必須です'),
      rules.custom(
        (value) => (VALID_ANIMAL_TYPES as readonly string[]).includes(value as string),
        '有効な獣種を選択してください'
      ),
    ],
  },
  latitude: {
    name: 'latitude',
    defaultValue: '',
    rules: [
      rules.required('緯度は必須です'),
      rules.custom((value) => {
        const num = parseFloat(value as string);
        return !isNaN(num) && num >= -90 && num <= 90;
      }, '緯度は-90から90の範囲で入力してください'),
    ],
  },
  longitude: {
    name: 'longitude',
    defaultValue: '',
    rules: [
      rules.required('経度は必須です'),
      rules.custom((value) => {
        const num = parseFloat(value as string);
        return !isNaN(num) && num >= -180 && num <= 180;
      }, '経度は-180から180の範囲で入力してください'),
    ],
  },
  address: {
    name: 'address',
    defaultValue: '',
    rules: [
      rules.required('住所は必須です'),
      rules.minLength(1, '住所を入力してください'),
    ],
  },
  phoneNumber: {
    name: 'phoneNumber',
    defaultValue: '',
    rules: [
      // 任意フィールド（入力時のみバリデーション）
      rules.custom((value) => {
        if (!value || (value as string).trim() === '') return true;
        // 電話番号形式：数字、ハイフン、括弧、スペースのみ許可
        const phonePattern = /^[\d\-\(\)\s]+$/;
        return phonePattern.test(value as string);
      }, '有効な電話番号を入力してください'),
    ],
  },
  imageUrls: {
    name: 'imageUrls',
    defaultValue: '',
    rules: [
      // 画像はImageUploaderコンポーネント経由でアップロードされるため、
      // バリデーションはフォーム送信時に別途行う
    ],
  },
  description: {
    name: 'description',
    defaultValue: '',
    rules: [
      rules.required('説明は必須です'),
      rules.minLength(1, '説明を入力してください'),
    ],
  },
};

/**
 * Reportフォームatom群
 */
export const reportFormAtoms =
  createFormAtoms<ReportFormValues>(reportFormSchema);

/**
 * バリデーションルール（フィールドフック用）
 */
export const reportValidationRules = {
  animalType: reportFormSchema.animalType.rules ?? [],
  latitude: reportFormSchema.latitude.rules ?? [],
  longitude: reportFormSchema.longitude.rules ?? [],
  address: reportFormSchema.address.rules ?? [],
  phoneNumber: reportFormSchema.phoneNumber.rules ?? [],
  imageUrls: reportFormSchema.imageUrls.rules ?? [],
  description: reportFormSchema.description.rules ?? [],
};
