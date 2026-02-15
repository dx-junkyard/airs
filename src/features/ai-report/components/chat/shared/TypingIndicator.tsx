import React from 'react';
import SharedTypingIndicator from '@/components/ui/Chat/TypingIndicator/TypingIndicator';
import BotAvatar from '@/components/ui/Chat/BotAvatar/BotAvatar';

/**
 * AI獣害通報用タイピングインジケータ
 *
 * 青色アバター + デフォルトinfoアイコンを使用
 */
export const TypingIndicator: React.FC = () => {
  return <SharedTypingIndicator avatar={<BotAvatar />} />;
};

export default TypingIndicator;
