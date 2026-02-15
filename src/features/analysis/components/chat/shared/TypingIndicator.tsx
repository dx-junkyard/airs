import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import SharedTypingIndicator from '@/components/ui/Chat/TypingIndicator/TypingIndicator';
import BotAvatar from '@/components/ui/Chat/BotAvatar/BotAvatar';

/**
 * Analysis用タイピングインジケータ
 *
 * 緑色アバター + ロボットアイコンを使用
 */
export const TypingIndicator: React.FC = () => {
  return (
    <SharedTypingIndicator
      avatar={
        <BotAvatar
          colorClassName="bg-green-700"
          icon={<FontAwesomeIcon icon={faRobot} className="size-4" />}
        />
      }
    />
  );
};

export default TypingIndicator;
