'use client';

import React from 'react';
import type { UIMessage } from '@ai-sdk/react';
import ChatMessageList from '@/components/ui/Chat/ChatMessageList/ChatMessageList';
import AnalysisChatMessage from './AnalysisChatMessage';
import TypingIndicator from './shared/TypingIndicator';

interface AnalysisChatMessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  footerContent?: React.ReactNode;
}

export const AnalysisChatMessageList: React.FC<
  AnalysisChatMessageListProps
> = ({ messages, isLoading, footerContent }) => {
  return (
    <ChatMessageList<UIMessage>
      messages={messages}
      renderMessage={(message) => <AnalysisChatMessage message={message} />}
      getMessageKey={(message) => message.id}
      isLoading={isLoading}
      loadingIndicator={<TypingIndicator />}
      showScrollButton={false}
      footerContent={footerContent}
    />
  );
};

export default AnalysisChatMessageList;
