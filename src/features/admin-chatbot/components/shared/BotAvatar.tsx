import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset } from '@fortawesome/free-solid-svg-icons';
import SharedBotAvatar from '@/components/ui/Chat/BotAvatar/BotAvatar';

/**
 * 管理者チャットボット用アバター
 *
 * 青色背景 + ヘッドセットアイコンを使用
 */
export const BotAvatar: React.FC = () => {
  return (
    <SharedBotAvatar
      colorClassName="bg-blue-800"
      icon={<FontAwesomeIcon icon={faHeadset} className="size-4" />}
    />
  );
};

export default BotAvatar;
