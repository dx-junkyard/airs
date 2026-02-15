'use client';

import React from 'react';
import type { BotReportDraftMessage } from '@/features/ai-report/types/chat';
import ChatBubble from '@/components/ui/Chat/ChatBubble/ChatBubble';
import BotAvatar from '@/features/ai-report/components/chat/shared/BotAvatar';

interface BotReportDraftBubbleProps {
  message: BotReportDraftMessage;
}

export const BotReportDraftBubble: React.FC<BotReportDraftBubbleProps> = ({
  message,
}) => {
  const { draft } = message;

  return (
    <ChatBubble variant="bot" avatar={<BotAvatar />}>
      <div className="rounded-lg border border-solid-gray-200 bg-white p-4">
        <h3 className="mb-3 font-bold text-solid-gray-900">
          【報告内容】
        </h3>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium text-solid-gray-600">
              ■ いつ
            </dt>
            <dd className="ml-4 text-solid-gray-900">{draft.when}</dd>
          </div>
          <div>
            <dt className="font-medium text-solid-gray-600">
              ■ どこで
            </dt>
            <dd className="ml-4 text-solid-gray-900">{draft.where}</dd>
          </div>
          <div>
            <dt className="font-medium text-solid-gray-600">
              ■ 何が
            </dt>
            <dd className="ml-4 text-solid-gray-900">{draft.what}</dd>
          </div>
          <div>
            <dt className="font-medium text-solid-gray-600">
              ■ 状況
            </dt>
            <dd className="ml-4 text-solid-gray-900">{draft.situation}</dd>
          </div>
        </dl>
      </div>
    </ChatBubble>
  );
};

export default BotReportDraftBubble;
