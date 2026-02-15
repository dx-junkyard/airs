import { createFormAtoms } from '@/hooks/forms/core/createFormAtoms';
import type { FormSchema, FormValues } from '@/hooks/forms/core/types';
import { rules } from '@/hooks/forms/core/validation';

/**
 * Staffフォームの値型
 */
export interface StaffFormValues extends FormValues {
  name: string;
  email: string;
}

/**
 * Staffフォームスキーマ
 */
const staffFormSchema: FormSchema<StaffFormValues> = {
  name: {
    name: 'name',
    defaultValue: '',
    rules: [
      rules.required('職員名は必須です'),
      rules.maxLength(100, '職員名は100文字以内で入力してください'),
    ],
  },
  email: {
    name: 'email',
    defaultValue: '',
    rules: [
      rules.email('有効なメールアドレスを入力してください'),
      rules.maxLength(254, 'メールアドレスは254文字以内で入力してください'),
    ],
  },
};

/**
 * Staffフォームatom群
 */
export const staffFormAtoms = createFormAtoms<StaffFormValues>(staffFormSchema);

/**
 * バリデーションルール（フィールドフック用）
 */
export const staffValidationRules = {
  name: staffFormSchema.name.rules ?? [],
  email: staffFormSchema.email.rules ?? [],
};
