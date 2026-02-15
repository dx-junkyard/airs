import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import SharedBotAvatar from '@/components/ui/Chat/BotAvatar/BotAvatar';

/**
 * Analysis用ボットアバター
 *
 * 緑色背景 + ロボットアイコンを使用
 */
export const BotAvatar: React.FC = () => {
  return (
    <SharedBotAvatar
      colorClassName="bg-green-700"
      icon={<FontAwesomeIcon icon={faRobot} className="size-4" />}
    />
  );
};

export default BotAvatar;
