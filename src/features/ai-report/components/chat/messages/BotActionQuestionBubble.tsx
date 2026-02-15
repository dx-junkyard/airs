import React from 'react';
import type { BotActionQuestionMessage } from '@/features/ai-report/types/chat';
import BotAvatar from '@/components/ui/Chat/BotAvatar/BotAvatar';

interface BotActionQuestionBubbleProps {
  message: BotActionQuestionMessage;
}

export const BotActionQuestionBubble: React.FC<BotActionQuestionBubbleProps> = ({
  message,
}) => {
  const { question } = message;

  return (
    <div className="flex items-start gap-3">
      <BotAvatar />
      <div className="max-w-[85%] space-y-3">
        <div className={`
          rounded-2xl rounded-tl-sm bg-solid-gray-100 px-4 py-3 text-sm
          text-solid-gray-900
        `}>
          {question.questionText}
        </div>
        <div className="flex flex-wrap gap-2">
          {question.choices.map((choice) => (
            <div
              key={choice.id}
              className={`
                rounded-lg border border-solid-gray-200 bg-white px-3 py-1.5
                text-xs text-solid-gray-700
              `}
            >
              {choice.label}
            </div>
          ))}
          {question.allowOther && (
            <div className={`
              rounded-lg border border-dashed border-solid-gray-300 bg-white
              px-3 py-1.5 text-xs text-solid-gray-500
            `}>
              その他（入力）
            </div>
          )}
        </div>
        {question.choiceType === 'multiple' && (
          <p className="text-xs text-solid-gray-500">
            複数選択可能
          </p>
        )}
      </div>
    </div>
  );
};

export default BotActionQuestionBubble;
