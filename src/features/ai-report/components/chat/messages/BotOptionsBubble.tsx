import React from 'react';
import type { BotOptionsMessage } from '@/features/ai-report/types/chat';
import BotAvatar from '@/features/ai-report/components/chat/shared/BotAvatar';

interface BotOptionsBubbleProps {
  message: BotOptionsMessage;
}

export const BotOptionsBubble: React.FC<BotOptionsBubbleProps> = ({
  message,
}) => {
  return (
    <div className="flex items-start gap-3">
      <BotAvatar />
      <div className="flex max-w-[80%] flex-col gap-2">
        <div className={`
          rounded-2xl bg-solid-gray-50 px-4 py-3 text-sm whitespace-pre-wrap
          text-solid-gray-900
        `}>
          {message.content}
        </div>
        {/* Options are rendered by the input component, not here */}
        {/* This is just to show the bot asked a question */}
      </div>
    </div>
  );
};

export default BotOptionsBubble;
