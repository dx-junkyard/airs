import React from 'react';
import {
  primaryButtonStyles,
} from '@/components/ui/Chat/styles';

interface ConfirmButtonsProps {
  onConfirm: () => void;
  isProcessing?: boolean;
}

export const ConfirmButtons: React.FC<ConfirmButtonsProps> = ({
  onConfirm,
  isProcessing = false,
}) => {
  return (
    <button
      type="button"
      onClick={onConfirm}
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
        '送信する'
      )}
    </button>
  );
};

export default ConfirmButtons;
