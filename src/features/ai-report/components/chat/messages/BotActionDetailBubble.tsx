import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { BotActionDetailMessage } from '@/features/ai-report/types/chat';
import { ACTION_CATEGORIES } from '@/features/ai-report/types/actionDetail';
import BotAvatar from '@/components/ui/Chat/BotAvatar/BotAvatar';
import { getActionCategoryIcon } from '@/features/ai-report/utils/actionCategoryIconMap';

interface BotActionDetailBubbleProps {
  message: BotActionDetailMessage;
}

export const BotActionDetailBubble: React.FC<BotActionDetailBubbleProps> = ({
  message,
}) => {
  const categoryInfo = ACTION_CATEGORIES.find((c) => c.id === message.category);

  return (
    <div className="flex items-start gap-3">
      <BotAvatar />
      <div className="max-w-[85%] space-y-2">
        {message.content && (
          <div className={`
            rounded-2xl rounded-tl-sm bg-solid-gray-100 px-4 py-3 text-sm
            text-solid-gray-900
          `}>
            {message.content}
          </div>
        )}
        <div className={`rounded-xl border border-solid-gray-200 bg-white p-4`}>
          {categoryInfo && (
            <div className="mb-2 flex items-center gap-2">
              <FontAwesomeIcon
                icon={getActionCategoryIcon(categoryInfo.id)}
                className="size-4 text-solid-gray-700"
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-solid-gray-700">
                {categoryInfo.label}
              </span>
            </div>
          )}
          <div className={`
            rounded-lg bg-blue-50 p-3 text-sm leading-relaxed
            text-solid-gray-800
          `}>
            {message.detail}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotActionDetailBubble;
