import type { ValidationRule } from './types';

/** メールアドレス正規表現 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 空値チェック
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * 個別ルールの適用
 */
function applyRule<T>(
  value: T,
  rule: ValidationRule,
  formValues: Record<string, unknown>
): string | null {
  switch (rule.type) {
    case 'required':
      if (isEmpty(value)) {
        return rule.message;
      }
      break;

    case 'email':
      if (!isEmpty(value) && typeof value === 'string') {
        if (!EMAIL_REGEX.test(value)) {
          return rule.message;
        }
      }
      break;

    case 'minLength':
      if (!isEmpty(value) && typeof value === 'string') {
        if (value.length < (rule.value as number)) {
          return rule.message;
        }
      }
      break;

    case 'maxLength':
      if (!isEmpty(value) && typeof value === 'string') {
        if (value.length > (rule.value as number)) {
          return rule.message;
        }
      }
      break;

    case 'pattern':
      if (!isEmpty(value) && typeof value === 'string') {
        const regex = new RegExp(rule.value as string);
        if (!regex.test(value)) {
          return rule.message;
        }
      }
      break;

    case 'custom':
      if (rule.validator && !rule.validator(value, formValues)) {
        return rule.message;
      }
      break;
  }
  return null;
}

/**
 * 単一フィールドのバリデーション実行
 */
export function validateField<T>(
  value: T,
  rules: ValidationRule[] = [],
  formValues: Record<string, unknown> = {}
): string | null {
  for (const rule of rules) {
    const errorMessage = applyRule(value, rule, formValues);
    if (errorMessage) {
      return errorMessage;
    }
  }
  return null;
}

/**
 * 事前定義バリデーションルール生成関数
 */
export const rules = {
  required: (message = '必須項目です'): ValidationRule => ({
    type: 'required',
    message,
  }),

  email: (
    message = '有効なメールアドレスを入力してください'
  ): ValidationRule => ({
    type: 'email',
    message,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    type: 'minLength',
    message: message ?? `${length}文字以上で入力してください`,
    value: length,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    type: 'maxLength',
    message: message ?? `${length}文字以内で入力してください`,
    value: length,
  }),

  pattern: (regex: string | RegExp, message: string): ValidationRule => ({
    type: 'pattern',
    message,
    value: typeof regex === 'string' ? regex : regex.source,
  }),

  custom: (
    validator: (value: unknown, formValues: Record<string, unknown>) => boolean,
    message: string
  ): ValidationRule => ({
    type: 'custom',
    message,
    validator,
  }),
};
