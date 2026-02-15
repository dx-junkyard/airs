import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { UserActionCategoryMessage } from '@/features/ai-report/types/chat';
import { getActionCategoryIcon } from '@/features/ai-report/utils/actionCategoryIconMap';

interface UserActionCategoryBubbleProps {
  message: UserActionCategoryMessage;
}

export const UserActionCategoryBubble: React.FC<UserActionCategoryBubbleProps> = ({
  message,
}) => {
  return (
    <div className="flex items-start justify-end">
      <div className={`
        flex items-center gap-2 rounded-2xl bg-blue-900 px-4 py-3 text-sm
        text-white
      `}>
        <FontAwesomeIcon
          icon={getActionCategoryIcon(message.category)}
          className="size-4"
          aria-hidden="true"
        />
        <span>{message.label}</span>
      </div>
    </div>
  );
};

export default UserActionCategoryBubble;
