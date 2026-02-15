import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { BotActionCategoryOptionsMessage } from '@/features/ai-report/types/chat';
import BotAvatar from '@/components/ui/Chat/BotAvatar/BotAvatar';
import { getActionCategoryIcon } from '@/features/ai-report/utils/actionCategoryIconMap';

interface BotActionCategoryOptionsBubbleProps {
  message: BotActionCategoryOptionsMessage;
}

export const BotActionCategoryOptionsBubble: React.FC<BotActionCategoryOptionsBubbleProps> = ({
  message,
}) => {
  return (
    <div className="flex items-start gap-3">
      <BotAvatar />
      <div className="max-w-[85%] space-y-3">
        <div className={`
          rounded-2xl rounded-tl-sm bg-solid-gray-100 px-4 py-3 text-sm
          text-solid-gray-900
        `}>
          {message.content}
        </div>
        <div className={`
          grid grid-cols-2 gap-2
          sm:grid-cols-4
        `}>
          {message.options.map((option) => (
            <div
              key={option.id}
              className={`
                flex flex-col items-center gap-1 rounded-lg border
                border-solid-gray-200 bg-white px-3 py-2 text-xs
              `}
            >
              <FontAwesomeIcon
                icon={getActionCategoryIcon(option.id)}
                className="size-4 text-solid-gray-700"
                aria-hidden="true"
              />
              <span className="font-medium">{option.label}</span>
              <span className="text-center text-solid-gray-500">
                {option.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BotActionCategoryOptionsBubble;
