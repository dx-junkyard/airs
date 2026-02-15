import React from 'react';
import type { UserActionAnswerMessage } from '@/features/ai-report/types/chat';

interface UserActionAnswerBubbleProps {
  message: UserActionAnswerMessage;
}

export const UserActionAnswerBubble: React.FC<UserActionAnswerBubbleProps> = ({
  message,
}) => {
  const choiceLabels = message.selectedChoices.map((c) => c.label).join('、');
  const displayText = message.otherText
    ? `${choiceLabels}${choiceLabels ? '、' : ''}${message.otherText}`
    : choiceLabels;

  return (
    <div className="flex items-start justify-end">
      <div className={`
        max-w-[80%] rounded-2xl bg-blue-900 px-4 py-3 text-sm text-white
      `}>
        {displayText}
      </div>
    </div>
  );
};

export default UserActionAnswerBubble;
