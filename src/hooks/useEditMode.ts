'use client';

import { useState } from 'react';

function useEditMode<T = any>(initialEditing = false) {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [originalData, setOriginalData] = useState<T | null>(null);

  const startEditing = (data: T) => {
    setOriginalData(data);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    return originalData;
  };

  const finishEditing = () => {
    setIsEditing(false);
    setOriginalData(null);
  };

  return {
    isEditing,
    originalData,
    startEditing,
    cancelEditing,
    finishEditing,
  };
}

export default useEditMode;
