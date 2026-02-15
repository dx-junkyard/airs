'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

interface AnalysisChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResetConversation: () => void;
  isLoading: boolean;
  canResetConversation: boolean;
}

export const AnalysisChatInput: React.FC<AnalysisChatInputProps> = ({
  input,
  onInputChange,
  onSubmit,
  onResetConversation,
  isLoading,
  canResetConversation,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // IME変換中は送信しない
    if (e.nativeEvent.isComposing) {
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form
      data-analysis-form
      onSubmit={onSubmit}
      className={`w-full bg-white px-3 py-2`}
    >
      <div className="mx-auto max-w-4xl">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="質問を入力..."
            rows={1}
            disabled={isLoading}
            className={`
              [field-sizing:content]
              min-h-10 min-w-0 flex-1 resize-none rounded-lg border
              border-solid-gray-300 px-3 py-2 text-sm leading-6
              transition-colors
              placeholder:text-solid-gray-400
              focus:border-green-500 focus:ring-2 focus:ring-green-500/20
              focus:outline-none
              disabled:bg-solid-gray-50 disabled:text-solid-gray-500
            `}
            style={{ maxHeight: '160px' }}
          />
          <div className="flex shrink-0 flex-col items-center gap-2 self-end">
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`
                flex size-10 items-center justify-center rounded-lg bg-green-700
                text-white transition-colors
                hover:bg-green-600
                disabled:cursor-not-allowed disabled:bg-solid-gray-300
              `}
            >
              <FontAwesomeIcon icon={faPaperPlane} className="size-4" />
            </button>
          </div>
        </div>
        <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center text-xs">
          <p className="col-start-2 text-center text-solid-gray-400">
            AI回答のため正確性は保証されません
          </p>
          <button
            type="button"
            onClick={onResetConversation}
            disabled={!canResetConversation || isLoading}
            title="会話をリセット"
            aria-label="会話をリセット"
            className={`
              col-start-3 flex size-7 items-center justify-center
              justify-self-end rounded-md text-solid-gray-700 transition-colors
              hover:bg-solid-gray-100
              disabled:cursor-not-allowed disabled:text-solid-gray-400
            `}
          >
            <FontAwesomeIcon icon={faRotateLeft} className="size-3.5" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default AnalysisChatInput;
