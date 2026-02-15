'use client';

import React from 'react';
import {
  primaryButtonStyles,
  secondaryButtonStyles,
} from '@/components/ui/Chat/styles';

interface ReportConfirmInputProps {
  onRequestCorrection: () => void;
  onSubmit: () => void;
  isProcessing?: boolean;
}

export const ReportConfirmInput: React.FC<ReportConfirmInputProps> = ({
  onRequestCorrection,
  onSubmit,
  isProcessing = false,
}) => {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onRequestCorrection}
        disabled={isProcessing}
        className={`
          ${secondaryButtonStyles.base}
          ${secondaryButtonStyles.disabled}
        `}
      >
        修正を伝える
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isProcessing}
        className={`
          ${primaryButtonStyles.base}
          ${primaryButtonStyles.disabled}
        `}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <div
              className={`
                size-4 animate-spin rounded-full border-2 border-white
                border-t-transparent
              `}
            />
            <span>送信中...</span>
          </div>
        ) : (
          'この内容で通報する'
        )}
      </button>
    </div>
  );
};

export default ReportConfirmInput;
