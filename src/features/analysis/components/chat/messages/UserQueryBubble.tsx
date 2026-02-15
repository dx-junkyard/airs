import React from 'react';
import ChatBubble from '@/components/ui/Chat/ChatBubble/ChatBubble';

interface UserQueryBubbleProps {
  content: string;
}

export const UserQueryBubble: React.FC<UserQueryBubbleProps> = ({
  content,
}) => {
  return <ChatBubble variant="user">{content}</ChatBubble>;
};

export default UserQueryBubble;
