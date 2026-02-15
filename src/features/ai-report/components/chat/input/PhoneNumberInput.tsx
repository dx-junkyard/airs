'use client';

import React, { useState } from 'react';
import {
  primaryButtonStyles,
  secondaryButtonStyles,
} from '@/components/ui/Chat/styles';

interface PhoneNumberInputProps {
  onSubmit: (phoneNumber: string) => void;
  onSkip: () => void;
}

/**
 * 電話番号の形式を検証する
 * ハイフンを除去した後、0から始まる10〜11桁の数字であることを確認
 */
export function validatePhoneNumber(value: string): boolean {
  if (!value.trim()) return true;
  const digitsOnly = value.trim().replace(/-/g, '');
  return /^0\d{9,10}$/.test(digitsOnly);
}

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  onSubmit,
  onSkip,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmed = phoneNumber.trim();
    if (!trimmed) {
      onSkip();
      return;
    }
    if (!validatePhoneNumber(trimmed)) {
      setError('電話番号の形式が正しくありません');
      return;
    }
    setError(null);
    onSubmit(trimmed);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => {
            setPhoneNumber(e.target.value);
            if (error) setError(null);
          }}
          placeholder="例: 090-1234-5678"
          className={`
            w-full rounded-lg border p-3 text-solid-gray-900
            placeholder:text-solid-gray-400
            focus:border-blue-500 focus:ring-1 focus:ring-blue-500
            focus:outline-none
            ${error ? 'border-red-500' : 'border-solid-gray-300'}
          `}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSkip}
          className={secondaryButtonStyles.base}
        >
          スキップ
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className={primaryButtonStyles.base}
        >
          送信
        </button>
      </div>
    </div>
  );
};

export default PhoneNumberInput;
