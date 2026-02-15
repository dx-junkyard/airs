import React from 'react';
import type { UserSelectionMessage } from '@/features/ai-report/types/chat';
import ChatBubble from '@/components/ui/Chat/ChatBubble/ChatBubble';

interface UserSelectionBubbleProps {
  message: UserSelectionMessage;
}

export const UserSelectionBubble: React.FC<UserSelectionBubbleProps> = ({
  message,
}) => {
  return (
    <ChatBubble variant="user">
      {message.selectedOption.icon && (
        <span className="mr-2">{message.selectedOption.icon}</span>
      )}
      {message.selectedOption.label}
    </ChatBubble>
  );
};

export default UserSelectionBubble;
