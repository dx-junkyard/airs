'use client';

import React from 'react';
import type { UIMessage } from '@ai-sdk/react';
import ChatMessageList from '@/components/ui/Chat/ChatMessageList/ChatMessageList';
import AdminChatbotMessage from './AdminChatbotMessage';
import TypingIndicator from './shared/TypingIndicator';

interface AdminChatbotMessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  footerContent?: React.ReactNode;
}

export const AdminChatbotMessageList: React.FC<
  AdminChatbotMessageListProps
> = ({ messages, isLoading, footerContent }) => {
  return (
    <ChatMessageList<UIMessage>
      messages={messages}
      renderMessage={(message) => <AdminChatbotMessage message={message} />}
      getMessageKey={(message) => message.id}
      isLoading={isLoading}
      loadingIndicator={<TypingIndicator />}
      showScrollButton={false}
      footerContent={footerContent}
    />
  );
};

export default AdminChatbotMessageList;
