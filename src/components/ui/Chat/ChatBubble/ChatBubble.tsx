import React from 'react';
import { chatBubbleStyles } from '@/components/ui/Chat/styles';

export type ChatBubbleVariant = 'bot' | 'user';

interface ChatBubbleProps {
  /** バブルの種類（bot: 左寄せグレー背景、user: 右寄せ青背景） */
  variant: ChatBubbleVariant;
  /** bot時のみ表示されるアバター */
  avatar?: React.ReactNode;
  /** バブル内のコンテンツ */
  children: React.ReactNode;
  /** 追加スタイル */
  className?: string;
  /** 最大幅クラス。デフォルト: 'max-w-[80%]' */
  maxWidthClassName?: string;
}

/**
 * チャットバブルコンポーネント
 *
 * bot用とuser用で異なるスタイルを適用
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({
  variant,
  avatar,
  children,
  className = '',
  maxWidthClassName = chatBubbleStyles.maxWidth,
}) => {
  const isBot = variant === 'bot';

  const bubbleClassName = `
    ${chatBubbleStyles.base}
    ${isBot ? chatBubbleStyles.bot : chatBubbleStyles.user}
    ${maxWidthClassName}
    ${className}
  `.trim();

  if (isBot) {
    return (
      <div className="flex items-start gap-3">
        {avatar}
        <div className={bubbleClassName}>{children}</div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-end">
      <div className={bubbleClassName}>{children}</div>
    </div>
  );
};

export default ChatBubble;
