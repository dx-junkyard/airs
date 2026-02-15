import React from 'react';
import { avatarStyles } from '@/components/ui/Chat/styles';

interface BotAvatarProps {
  /** アバターの背景色クラス。デフォルト: 'bg-blue-900' */
  colorClassName?: string;
  /** アバター内に表示するアイコン。デフォルト: info icon SVG */
  icon?: React.ReactNode;
  /** アバターのサイズクラス。デフォルト: 'size-8' */
  sizeClassName?: string;
}

/** デフォルトのinfoアイコン */
const DefaultInfoIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="size-5"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
  </svg>
);

/**
 * チャットのボットアバターコンポーネント
 *
 * analysis用: <BotAvatar colorClassName="bg-green-700" icon={<FontAwesomeIcon icon={faRobot} />} />
 * line-verify用: <BotAvatar /> (デフォルト)
 */
export const BotAvatar: React.FC<BotAvatarProps> = ({
  colorClassName = 'bg-blue-900',
  icon,
  sizeClassName = avatarStyles.size,
}) => {
  return (
    <div
      className={`
        ${avatarStyles.base}
        ${sizeClassName}
        ${colorClassName}
      `}
    >
      {icon ?? <DefaultInfoIcon />}
    </div>
  );
};

export default BotAvatar;
