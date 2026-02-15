import React from 'react';
import BotAvatar from '@/components/ui/Chat/BotAvatar/BotAvatar';
import { chatBubbleStyles, typingStyles } from '@/components/ui/Chat/styles';

interface TypingIndicatorProps {
  /** カスタムアバター */
  avatar?: React.ReactNode;
  /** バブルスタイル上書き */
  bubbleClassName?: string;
}

/** デフォルトのバブルスタイル */
const getDefaultBubbleClassName = () => `
  flex items-center gap-1
  ${chatBubbleStyles.base}
  ${chatBubbleStyles.bot}
`;

/**
 * タイピングインジケータコンポーネント
 *
 * ボットがメッセージを入力中であることを示すアニメーション
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  avatar,
  bubbleClassName,
}) => {
  return (
    <div className="flex items-start gap-3">
      {avatar ?? <BotAvatar />}
      <div className={bubbleClassName ?? getDefaultBubbleClassName()}>
        {typingStyles.delays.map((delay, index) => (
          <span
            key={index}
            className={`
              ${typingStyles.dot}
              ${delay}
            `}
          />
        ))}
      </div>
    </div>
  );
};

export default TypingIndicator;
