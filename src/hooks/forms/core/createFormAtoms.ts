import { atom } from 'jotai';

import type { FieldAtoms, FormAtoms, FormSchema, FormValues } from './types';

/**
 * 単一フィールドのatom群を生成
 */
function createFieldAtoms<T>(defaultValue: T): FieldAtoms<T> {
  return {
    valueAtom: atom(defaultValue),
    errorAtom: atom<string | null>(null),
    touchedAtom: atom(false),
  };
}

/**
 * フォームスキーマからatom群を生成
 */
export function createFormAtoms<T extends FormValues>(
  schema: FormSchema<T>
): FormAtoms<T> {
  const fieldEntries = Object.entries(schema) as [
    keyof T,
    (typeof schema)[keyof T],
  ][];

  const fields = {} as FormAtoms<T>['fields'];
  const initialValues = {} as T;

  for (const [fieldName, fieldDef] of fieldEntries) {
    initialValues[fieldName] = fieldDef.defaultValue as T[typeof fieldName];
    fields[fieldName] = createFieldAtoms(fieldDef.defaultValue) as FieldAtoms<
      T[typeof fieldName]
    >;
  }

  return {
    fields,
    schema,
    initialValues,
  };
}
