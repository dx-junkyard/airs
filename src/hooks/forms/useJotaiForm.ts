'use client';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useMemo } from 'react';

import type { FormAtoms, FormValues, UseJotaiFormReturn } from './core/types';
import { validateField } from './core/validation';

/**
 * Jotaiベースのフォーム管理フック
 */
function useJotaiForm<T extends FormValues>(
  formAtoms: FormAtoms<T>
): UseJotaiFormReturn<T> {
  const fieldNames = Object.keys(formAtoms.fields) as (keyof T)[];

  // 各フィールドのatom値を取得
  const fieldValues = fieldNames.map((name) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAtomValue(formAtoms.fields[name].valueAtom)
  );

  const fieldErrors = fieldNames.map((name) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAtomValue(formAtoms.fields[name].errorAtom)
  );

  const fieldSetters = fieldNames.map((name) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSetAtom(formAtoms.fields[name].valueAtom)
  );

  const errorSetters = fieldNames.map((name) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSetAtom(formAtoms.fields[name].errorAtom)
  );

  const touchedSetters = fieldNames.map((name) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSetAtom(formAtoms.fields[name].touchedAtom)
  );

  // フォーム全体の値を構築
  const values = useMemo(() => {
    const result = {} as T;
    fieldNames.forEach((name, index) => {
      result[name] = fieldValues[index] as T[typeof name];
    });
    return result;
  }, [fieldNames, fieldValues]);

  // フォーム全体のエラーを構築
  const errors = useMemo(() => {
    const result = {} as Partial<Record<keyof T, string | null>>;
    fieldNames.forEach((name, index) => {
      if (fieldErrors[index]) {
        result[name] = fieldErrors[index];
      }
    });
    return result;
  }, [fieldNames, fieldErrors]);

  // フォームが有効かどうか
  const isValid = useMemo(() => {
    return fieldErrors.every((error) => error === null);
  }, [fieldErrors]);

  // フォームが変更されたかどうか
  const isDirty = useMemo(() => {
    return fieldNames.some((name, index) => {
      return fieldValues[index] !== formAtoms.initialValues[name];
    });
  }, [fieldNames, fieldValues, formAtoms.initialValues]);

  // フォームリセット
  const reset = useCallback(() => {
    fieldNames.forEach((name, index) => {
      fieldSetters[index](formAtoms.initialValues[name] as T[keyof T]);
      errorSetters[index](null);
      touchedSetters[index](false);
    });
  }, [
    fieldNames,
    fieldSetters,
    errorSetters,
    touchedSetters,
    formAtoms.initialValues,
  ]);

  // 全フィールドバリデーション
  const validateAll = useCallback(() => {
    let allValid = true;
    fieldNames.forEach((name, index) => {
      const fieldDef = formAtoms.schema[name];
      const error = validateField(fieldValues[index], fieldDef.rules ?? []);
      errorSetters[index](error);
      touchedSetters[index](true);
      if (error) {
        allValid = false;
      }
    });
    return allValid;
  }, [fieldNames, fieldValues, errorSetters, touchedSetters, formAtoms.schema]);

  // FormData生成（Server Actions連携用）
  const getFormData = useCallback(() => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'boolean') {
          formData.append(key, String(value));
        } else if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, String(v)));
        } else {
          formData.append(key, String(value));
        }
      }
    }
    return formData;
  }, [values]);

  // 個別フィールドの値設定
  const setFieldValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      const index = fieldNames.indexOf(field);
      if (index !== -1) {
        fieldSetters[index](value as T[keyof T]);
      }
    },
    [fieldNames, fieldSetters]
  );

  return {
    values,
    errors,
    isValid,
    isDirty,
    reset,
    validateAll,
    getFormData,
    setFieldValue,
  };
}

export default useJotaiForm;
