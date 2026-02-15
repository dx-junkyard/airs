import type { PrimitiveAtom } from 'jotai';

/**
 * フォーム値の基本型（インデックスシグネチャ付き）
 */
export type FormValues = {
  [key: string]: unknown;
};

/**
 * バリデーションルールの種別
 */
export type ValidationRuleType =
  | 'required'
  | 'email'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'custom';

/**
 * バリデーションルール
 */
export interface ValidationRule<T = unknown> {
  type: ValidationRuleType;
  message: string;
  value?: T;
  validator?: (value: unknown, formValues: FormValues) => boolean;
}

/**
 * フィールド定義
 */
export interface FieldDefinition<T = unknown> {
  name: string;
  defaultValue: T;
  rules?: ValidationRule[];
}

/**
 * フィールドのatom群
 */
export interface FieldAtoms<T> {
  valueAtom: PrimitiveAtom<T>;
  errorAtom: PrimitiveAtom<string | null>;
  touchedAtom: PrimitiveAtom<boolean>;
}

/**
 * フォームスキーマの型
 */
export type FormSchema<T extends FormValues> = {
  [K in keyof T]: FieldDefinition<T[K]>;
};

/**
 * フォームのatom群
 */
export interface FormAtoms<T extends FormValues> {
  fields: {
    [K in keyof T]: FieldAtoms<T[K]>;
  };
  schema: FormSchema<T>;
  initialValues: T;
}

/**
 * useJotaiForm フックの返却型
 */
export interface UseJotaiFormReturn<T extends FormValues> {
  values: T;
  errors: Partial<Record<keyof T, string | null>>;
  isValid: boolean;
  isDirty: boolean;
  reset: () => void;
  validateAll: () => boolean;
  getFormData: () => FormData;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
}

/**
 * useJotaiFormField フックの返却型
 */
export interface UseJotaiFormFieldReturn<T> {
  value: T;
  error: string | null;
  touched: boolean;
  onChange: (value: T) => void;
  onBlur: () => void;
  validate: () => boolean;
  reset: () => void;
}

/**
 * useJotaiFormField フックのオプション
 */
export interface UseJotaiFormFieldOptions<T> {
  fieldAtoms: FieldAtoms<T>;
  rules?: ValidationRule[];
  defaultValue: T;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}
