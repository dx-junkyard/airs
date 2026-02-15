import React from 'react';
import type { BotTextMessage } from '@/features/ai-report/types/chat';
import ChatBubble from '@/components/ui/Chat/ChatBubble/ChatBubble';
import BotAvatar from '@/features/ai-report/components/chat/shared/BotAvatar';

interface BotTextBubbleProps {
  message: BotTextMessage;
}

export const BotTextBubble: React.FC<BotTextBubbleProps> = ({ message }) => {
  return (
    <ChatBubble
      variant="bot"
      avatar={<BotAvatar />}
      className="whitespace-pre-wrap"
    >
      {message.content}
    </ChatBubble>
  );
};

export default BotTextBubble;
