import React from 'react';
import Image from 'next/image';
import type { UserImageMessage } from '@/features/ai-report/types/chat';

interface UserImageBubbleProps {
  message: UserImageMessage;
}

export const UserImageBubble: React.FC<UserImageBubbleProps> = ({
  message,
}) => {
  return (
    <div className="flex items-start justify-end">
      <div className={`
        flex max-w-[600px] min-w-[400px] flex-col gap-2 rounded-2xl bg-blue-900
        p-2
      `}>
        <div className="relative h-80 w-full overflow-hidden rounded-lg">
          <Image
            src={message.imageUrl}
            alt={message.fileName ?? '投稿画像'}
            fill
            className="object-cover"
          />
        </div>
        {message.fileName && (
          <div className="px-2 pb-1 text-xs text-blue-100">
            {message.fileName}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserImageBubble;
