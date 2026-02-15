'use client';

import { useAtom } from 'jotai';
import { useCallback } from 'react';

import type {
  UseJotaiFormFieldOptions,
  UseJotaiFormFieldReturn,
} from './core/types';
import { validateField } from './core/validation';

/**
 * 個別フィールドの状態管理フック
 */
function useJotaiFormField<T>({
  fieldAtoms,
  rules = [],
  defaultValue,
  validateOnChange = true,
  validateOnBlur = true,
}: UseJotaiFormFieldOptions<T>): UseJotaiFormFieldReturn<T> {
  const [value, setValue] = useAtom(fieldAtoms.valueAtom);
  const [error, setError] = useAtom(fieldAtoms.errorAtom);
  const [touched, setTouched] = useAtom(fieldAtoms.touchedAtom);

  // バリデーション実行
  const validate = useCallback(() => {
    const errorMessage = validateField(value, rules);
    setError(errorMessage);
    return errorMessage === null;
  }, [value, rules, setError]);

  // 値変更ハンドラ
  const onChange = useCallback(
    (newValue: T) => {
      setValue(newValue);
      if (validateOnChange) {
        const errorMessage = validateField(newValue, rules);
        setError(errorMessage);
      }
    },
    [setValue, validateOnChange, rules, setError]
  );

  // blurハンドラ
  const onBlur = useCallback(() => {
    setTouched(true);
    if (validateOnBlur) {
      validate();
    }
  }, [setTouched, validateOnBlur, validate]);

  // フィールドリセット
  const reset = useCallback(() => {
    setValue(defaultValue);
    setError(null);
    setTouched(false);
  }, [setValue, setError, setTouched, defaultValue]);

  return {
    value,
    error,
    touched,
    onChange,
    onBlur,
    validate,
    reset,
  };
}

export default useJotaiFormField;
