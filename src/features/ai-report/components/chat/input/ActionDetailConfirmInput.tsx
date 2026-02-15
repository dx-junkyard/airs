'use client';

import React, { useState, useCallback } from 'react';

interface ActionDetailConfirmInputProps {
  onConfirm: () => void;
  onRequestCorrection: () => void;
  onBackToQuestion: () => void;
  isProcessing?: boolean;
}

export const ActionDetailConfirmInput: React.FC<ActionDetailConfirmInputProps> = ({
  onConfirm,
  onRequestCorrection,
  onBackToQuestion,
  isProcessing = false,
}) => {
  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-solid-gray-600">
        上記の行動詳細でよろしいですか？
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {/* 確定ボタン */}
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className={`
            rounded-lg bg-blue-900 px-6 py-2 text-sm font-medium text-white
            transition-all
            ${
              isProcessing
                ? 'cursor-not-allowed opacity-50'
                : `
                  hover:bg-blue-800
                  active:scale-95
                `
            }
          `}
        >
          この内容で確定
        </button>

        {/* 文章を修正ボタン */}
        <button
          onClick={onRequestCorrection}
          disabled={isProcessing}
          className={`
            rounded-lg border border-solid-gray-300 bg-white px-6 py-2 text-sm
            font-medium text-solid-gray-700 transition-all
            ${
              isProcessing
                ? 'cursor-not-allowed opacity-50'
                : `
                  hover:border-solid-gray-400 hover:bg-solid-gray-50
                  active:scale-95
                `
            }
          `}
        >
          文章を修正
        </button>

        {/* 回答を修正ボタン */}
        <button
          onClick={onBackToQuestion}
          disabled={isProcessing}
          className={`
            rounded-lg border border-solid-gray-300 bg-white px-6 py-2 text-sm
            font-medium text-solid-gray-700 transition-all
            ${
              isProcessing
                ? 'cursor-not-allowed opacity-50'
                : `
                  hover:border-solid-gray-400 hover:bg-solid-gray-50
                  active:scale-95
                `
            }
          `}
        >
          回答を修正
        </button>
      </div>
    </div>
  );
};

interface ActionDetailCorrectionInputProps {
  onSubmit: (correctionText: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const ActionDetailCorrectionInput: React.FC<ActionDetailCorrectionInputProps> = ({
  onSubmit,
  onCancel,
  isProcessing = false,
}) => {
  const [text, setText] = useState('');

  const handleSubmit = useCallback(() => {
    if (text.trim()) {
      onSubmit(text.trim());
    }
  }, [text, onSubmit]);

  const isSubmitDisabled = !text.trim() || isProcessing;

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-solid-gray-600">
        修正したい点を入力してください
      </p>

      <div className="mx-auto max-w-lg">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例: 方向は北東ではなく南西でした"
          disabled={isProcessing}
          rows={3}
          className={`
            w-full resize-none rounded-lg border border-solid-gray-300 px-4 py-3
            text-sm
            focus:border-blue-900 focus:ring-1 focus:ring-blue-900
            focus:outline-none
            ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}
          `}
        />
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className={`
            rounded-lg bg-blue-900 px-6 py-2 text-sm font-medium text-white
            transition-all
            ${
              isSubmitDisabled
                ? 'cursor-not-allowed opacity-50'
                : `
                  hover:bg-blue-800
                  active:scale-95
                `
            }
          `}
        >
          {isProcessing ? '修正中...' : '修正する'}
        </button>

        <button
          onClick={onCancel}
          disabled={isProcessing}
          className={`
            rounded-lg border border-solid-gray-300 bg-white px-6 py-2 text-sm
            font-medium text-solid-gray-700 transition-all
            ${
              isProcessing
                ? 'cursor-not-allowed opacity-50'
                : `
                  hover:border-solid-gray-400 hover:bg-solid-gray-50
                  active:scale-95
                `
            }
          `}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
};

export default ActionDetailConfirmInput;
