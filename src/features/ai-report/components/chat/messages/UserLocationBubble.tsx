import React from 'react';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { UserLocationMessage } from '@/features/ai-report/types/chat';
import ChatBubble from '@/components/ui/Chat/ChatBubble/ChatBubble';
import { formatLocationWithLandmark } from '@/features/ai-report/utils/locationFormatter';

interface UserLocationBubbleProps {
  message: UserLocationMessage;
}

export const UserLocationBubble: React.FC<UserLocationBubbleProps> = ({
  message,
}) => {
  return (
    <ChatBubble variant="user">
      <div className="mb-1 flex items-center gap-2">
        <FontAwesomeIcon
          icon={faMapMarkerAlt}
          className="size-4"
          aria-hidden="true"
        />
        <span className="font-semibold">位置情報</span>
      </div>
      <div className="text-blue-100">
        {formatLocationWithLandmark(message.location)}
      </div>
      <div className="mt-1 text-xs text-blue-200">
        緯度: {message.location.latitude.toFixed(6)}, 経度:{' '}
        {message.location.longitude.toFixed(6)}
      </div>
    </ChatBubble>
  );
};

export default UserLocationBubble;
