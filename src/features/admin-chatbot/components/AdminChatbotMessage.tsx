'use client';

import React from 'react';
import type { UIMessage } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatBubble from '@/components/ui/Chat/ChatBubble/ChatBubble';
import UserQueryBubble from '@/features/analysis/components/chat/messages/UserQueryBubble';
import BotAvatar from './shared/BotAvatar';

interface AdminChatbotMessageProps {
  message: UIMessage;
}

interface TextPart {
  type: 'text';
  text: string;
}

type MessagePart = TextPart | { type: string };

function isTextPart(part: MessagePart): part is TextPart {
  return part.type === 'text';
}

export const AdminChatbotMessage: React.FC<AdminChatbotMessageProps> = ({
  message,
}) => {
  const parts = message.parts as MessagePart[];

  if (message.role === 'user') {
    const textParts = parts.filter(isTextPart);
    const content = textParts.map((p) => p.text).join('');
    return <UserQueryBubble content={content} />;
  }

  if (message.role === 'assistant') {
    const textParts = parts.filter(isTextPart);
    const content = textParts.map((p) => p.text).join('');

    if (!content) return null;

    return (
      <ChatBubble variant="bot" avatar={<BotAvatar />}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="mb-2 text-lg font-bold">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-2 text-base font-bold">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-1 text-sm font-bold">{children}</h3>
            ),
            p: ({ children }) => (
              <p className={`
                mb-2
                last:mb-0
              `}>{children}</p>
            ),
            ul: ({ children }) => (
              <ul className={`
                mb-2 list-disc pl-4
                last:mb-0
              `}>{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className={`
                mb-2 list-decimal pl-4
                last:mb-0
              `}>{children}</ol>
            ),
            li: ({ children }) => <li className="mb-1">{children}</li>,
            code: ({ className, children }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className={`
                    rounded bg-solid-gray-200 px-1 py-0.5 text-xs
                  `}>
                    {children}
                  </code>
                );
              }
              return (
                <code
                  className={`
                    block overflow-x-auto rounded bg-solid-gray-800 p-2 text-xs
                    text-white
                  `}
                >
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className={`
                mb-2
                last:mb-0
              `}>{children}</pre>
            ),
            strong: ({ children }) => (
              <strong className="font-bold">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  text-blue-700 underline
                  hover:text-blue-600
                `}
              >
                {children}
              </a>
            ),
            hr: () => <hr className="my-2 border-solid-gray-300" />,
            blockquote: ({ children }) => (
              <blockquote className={`
                mb-2 border-l-4 border-solid-gray-300 pl-3 italic
                last:mb-0
              `}>
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </ChatBubble>
    );
  }

  return null;
};

export default AdminChatbotMessage;
