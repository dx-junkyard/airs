'use client';

import React from 'react';
import type { UIMessage } from '@ai-sdk/react';
import UserQueryBubble from './messages/UserQueryBubble';
import BotTextBubble from './messages/BotTextBubble';
import BotTableBubble from './messages/BotTableBubble';
import type { SqlQueryResult } from '@/features/analysis/types/analysis';

interface AnalysisChatMessageProps {
  message: UIMessage;
}

// Part types
interface TextPart {
  type: 'text';
  text: string;
}

interface ToolPart {
  type: string;
  toolCallId: string;
  toolName?: string;
  state?: string;
  result?: SqlQueryResult;
}

type MessagePart = TextPart | ToolPart;

function isTextPart(part: MessagePart): part is TextPart {
  return part.type === 'text';
}

function isToolPart(part: MessagePart): part is ToolPart {
  return (
    part.type.startsWith('tool-') ||
    part.type === 'dynamic-tool' ||
    'toolCallId' in part
  );
}

export const AnalysisChatMessage: React.FC<AnalysisChatMessageProps> = ({
  message,
}) => {
  const parts = message.parts as MessagePart[];

  // ユーザーメッセージ
  if (message.role === 'user') {
    const textParts = parts.filter(isTextPart);
    const content = textParts.map((p) => p.text).join('');
    return <UserQueryBubble content={content} />;
  }

  // アシスタントメッセージ
  if (message.role === 'assistant') {
    const textParts = parts.filter(isTextPart);
    const toolParts = parts.filter(isToolPart);

    const textContent = textParts.map((p) => p.text).join('');

    return (
      <div className="space-y-4">
        {/* ツール実行結果（テーブル表示） */}
        {toolParts.map((toolPart) => {
          // runSqlツールの結果を表示
          if (
            (toolPart.type === 'tool-runSql' || toolPart.toolName === 'runSql') &&
            toolPart.result
          ) {
            return (
              <BotTableBubble
                key={toolPart.toolCallId}
                result={toolPart.result}
              />
            );
          }
          return null;
        })}

        {/* テキストコンテンツ */}
        {textContent && <BotTextBubble content={textContent} />}
      </div>
    );
  }

  return null;
};

export default AnalysisChatMessage;
