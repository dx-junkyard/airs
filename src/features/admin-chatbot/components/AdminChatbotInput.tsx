'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

interface AdminChatbotInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResetConversation: () => void;
  isLoading: boolean;
  canResetConversation: boolean;
}

export const AdminChatbotInput: React.FC<AdminChatbotInputProps> = ({
  input,
  onInputChange,
  onSubmit,
  onResetConversation,
  isLoading,
  canResetConversation,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) {
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={onSubmit} className="bg-white p-3">
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <textarea
            value={input}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            placeholder="使い方について質問してください..."
            rows={1}
            disabled={isLoading}
            className={`
              h-10 w-full resize-none rounded-xl border border-solid-gray-300
              px-3 py-2 text-sm leading-6 transition-colors
              placeholder:text-solid-gray-400
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
              focus:outline-none
              disabled:bg-solid-gray-50 disabled:text-solid-gray-500
            `}
            style={{
              maxHeight: '80px',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`
            flex size-10 shrink-0 items-center justify-center rounded-xl
            bg-blue-800 text-white transition-colors
            hover:bg-blue-700
            disabled:cursor-not-allowed disabled:bg-solid-gray-300
          `}
        >
          <FontAwesomeIcon icon={faPaperPlane} className="size-4" />
        </button>
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
            col-start-3 flex size-7 items-center justify-center justify-self-end
            rounded-md text-solid-gray-700 transition-colors
            hover:bg-solid-gray-100
            disabled:cursor-not-allowed disabled:text-solid-gray-400
          `}
        >
          <FontAwesomeIcon icon={faRotateLeft} className="size-3.5" />
        </button>
      </div>
    </form>
  );
};

export default AdminChatbotInput;
