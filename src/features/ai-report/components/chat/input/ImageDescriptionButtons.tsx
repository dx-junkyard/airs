import React, { useState } from 'react';

interface ImageDescriptionConfirmProps {
  onConfirm: () => void;
  onCorrect: (correctionText: string) => void;
  isProcessing?: boolean;
  showCorrectionInput?: boolean;
}

export const ImageDescriptionConfirm: React.FC<ImageDescriptionConfirmProps> = ({
  onConfirm,
  onCorrect,
  isProcessing = false,
  showCorrectionInput = false,
}) => {
  const [correctionText, setCorrectionText] = useState('');

  if (showCorrectionInput) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-center text-sm text-solid-gray-600">
          どのように違うか教えてください
        </p>
        <textarea
          value={correctionText}
          onChange={(e) => setCorrectionText(e.target.value)}
          placeholder="例: サルではなくシカです / 2頭ではなく3頭います"
          disabled={isProcessing}
          rows={3}
          className={`
            w-full resize-none rounded-lg border border-solid-gray-200 bg-white
            px-4 py-3 text-sm text-solid-gray-900
            placeholder:text-solid-gray-400
            focus:border-blue-900 focus:ring-1 focus:ring-blue-900
            focus:outline-none
            disabled:cursor-not-allowed disabled:opacity-50
          `}
        />
        <button
          onClick={() => onCorrect(correctionText)}
          disabled={isProcessing || correctionText.trim().length === 0}
          className={`
            rounded-lg bg-blue-900 px-4 py-3 text-sm font-medium text-white
            transition-all
            hover:bg-blue-800
            active:scale-[0.99]
            disabled:cursor-not-allowed disabled:opacity-50
          `}
        >
          送信
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-solid-gray-600">
        この説明は合っていますか？
      </p>
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className={`
            flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-900
            px-4 py-3 text-sm font-medium text-white transition-all
            hover:bg-blue-800
            active:scale-[0.99]
            disabled:cursor-not-allowed disabled:opacity-50
          `}
        >
          はい
        </button>
        <button
          onClick={() => onCorrect('')}
          disabled={isProcessing}
          className={`
            flex flex-1 items-center justify-center gap-2 rounded-lg border
            border-solid-gray-200 bg-white px-4 py-3 text-sm font-medium
            text-solid-gray-900 transition-all
            hover:border-blue-900 hover:bg-blue-50
            active:scale-[0.99]
            disabled:cursor-not-allowed disabled:opacity-50
          `}
        >
          いいえ
        </button>
      </div>
    </div>
  );
};

export default ImageDescriptionConfirm;
