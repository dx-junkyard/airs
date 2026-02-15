'use client';

import { useState } from 'react';

function useFormState<T extends Record<string, any>>(initialState: T) {
  const [formData, setFormData] = useState<T>(initialState);

  const updateField = (field: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateFields = (fields: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const reset = () => {
    setFormData(initialState);
  };

  return {
    formData,
    updateField,
    updateFields,
    reset,
    setFormData,
  };
}

export default useFormState;
