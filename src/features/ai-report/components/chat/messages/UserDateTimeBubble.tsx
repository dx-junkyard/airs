'use client';

import React from 'react';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { UserDateTimeMessage } from '@/features/ai-report/types/chat';
import ChatBubble from '@/components/ui/Chat/ChatBubble/ChatBubble';
import { formatDateTime } from '@/features/ai-report/utils/reportFormatter';

interface UserDateTimeBubbleProps {
  message: UserDateTimeMessage;
}

export const UserDateTimeBubble: React.FC<UserDateTimeBubbleProps> = ({
  message,
}) => {
  return (
    <ChatBubble variant="user">
      <div className="mb-1 flex items-center gap-2">
        <FontAwesomeIcon icon={faClock} className="size-4" aria-hidden="true" />
        <span className="font-semibold">目撃日時</span>
      </div>
      <div className="text-blue-100">{formatDateTime(message.dateTime)}</div>
    </ChatBubble>
  );
};

export default UserDateTimeBubble;
