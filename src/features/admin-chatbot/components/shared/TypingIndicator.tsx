import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset } from '@fortawesome/free-solid-svg-icons';
import SharedTypingIndicator from '@/components/ui/Chat/TypingIndicator/TypingIndicator';
import SharedBotAvatar from '@/components/ui/Chat/BotAvatar/BotAvatar';

/**
 * 管理者チャットボット用タイピングインジケータ
 *
 * 青色アバター + ヘッドセットアイコンを使用
 */
export const TypingIndicator: React.FC = () => {
  return (
    <SharedTypingIndicator
      avatar={
        <SharedBotAvatar
          colorClassName="bg-blue-800"
          icon={<FontAwesomeIcon icon={faHeadset} className="size-4" />}
        />
      }
    />
  );
};

export default TypingIndicator;
