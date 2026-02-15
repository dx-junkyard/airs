import React from 'react';
import type { BotImageAnalysisDescriptionMessage } from '@/features/ai-report/types/chat';
import BotAvatar from '@/features/ai-report/components/chat/shared/BotAvatar';

interface BotImageAnalysisDescriptionBubbleProps {
  message: BotImageAnalysisDescriptionMessage;
}

export const BotImageAnalysisDescriptionBubble: React.FC<
  BotImageAnalysisDescriptionBubbleProps
> = ({ message }) => {
  return (
    <div className="flex items-start gap-3">
      <BotAvatar />
      <div className="flex max-w-[80%] flex-col gap-2">
        <div
          className={`
            rounded-2xl bg-solid-gray-50 px-4 py-3 text-sm whitespace-pre-wrap
            text-solid-gray-900
          `}
        >
          {message.content}
        </div>
        <div
          className={`
            rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm
            text-solid-gray-900
          `}
        >
          {message.description}
        </div>
      </div>
    </div>
  );
};

export default BotImageAnalysisDescriptionBubble;
