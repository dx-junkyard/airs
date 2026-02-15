'use client';

import React from 'react';
import { useAtomValue } from 'jotai';
import {
  messagesAtom,
  isBotTypingAtom,
} from '@/features/ai-report/atoms/chatAtoms';
import SharedChatMessageList from '@/components/ui/Chat/ChatMessageList/ChatMessageList';
import ChatMessage from './ChatMessage';
import TypingIndicator from './shared/TypingIndicator';
import type { ChatMessage as ChatMessageType } from '@/features/ai-report/types/chat';

export const ChatMessageList: React.FC = () => {
  const messages = useAtomValue(messagesAtom);
  const isBotTyping = useAtomValue(isBotTypingAtom);

  return (
    <SharedChatMessageList<ChatMessageType>
      messages={messages}
      renderMessage={(message) => <ChatMessage message={message} />}
      getMessageKey={(message) => message.id}
      isLoading={isBotTyping}
      loadingIndicator={<TypingIndicator />}
      showScrollButton={true}
    />
  );
};

export default ChatMessageList;
