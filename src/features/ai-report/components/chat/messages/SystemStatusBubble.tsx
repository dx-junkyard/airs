import React from 'react';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faCheck,
  faInfoCircle,
  faSpinner,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { SystemMessage } from '@/features/ai-report/types/chat';

interface SystemStatusBubbleProps {
  message: SystemMessage;
}

const statusConfig = {
  loading: {
    icon: faSpinner,
    bgColor: 'bg-solid-gray-100',
    textColor: 'text-solid-gray-700',
    iconClassName: 'animate-spin',
  },
  success: {
    icon: faCheck,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    iconClassName: '',
  },
  error: {
    icon: faXmark,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    iconClassName: '',
  },
  info: {
    icon: faInfoCircle,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    iconClassName: '',
  },
} satisfies Record<
  SystemMessage['status'],
  {
    icon: IconDefinition;
    bgColor: string;
    textColor: string;
    iconClassName: string;
  }
>;

export const SystemStatusBubble: React.FC<SystemStatusBubbleProps> = ({
  message,
}) => {
  const config = statusConfig[message.status];

  return (
    <div className="flex items-center justify-center">
      <div
        className={`
          flex items-center gap-2 rounded-full px-4 py-2 text-sm
          ${config.bgColor}
          ${config.textColor}
        `}
      >
        <FontAwesomeIcon
          icon={config.icon}
          className={`
            size-3.5
            ${config.iconClassName}
          `}
          aria-hidden="true"
        />
        <span>{message.content}</span>
      </div>
    </div>
  );
};

export default SystemStatusBubble;
