import React from 'react';
import type { ChatMessage as ChatMessageType } from '@/features/ai-report/types/chat';
import BotTextBubble from './messages/BotTextBubble';
import BotOptionsBubble from './messages/BotOptionsBubble';
import BotImageAnalysisDescriptionBubble from './messages/BotImageAnalysisOptionsBubble';
import BotReportDraftBubble from './messages/BotReportDraftBubble';
import BotActionCategoryOptionsBubble from './messages/BotActionCategoryOptionsBubble';
import BotActionQuestionBubble from './messages/BotActionQuestionBubble';
import BotActionDetailBubble from './messages/BotActionDetailBubble';
import UserSelectionBubble from './messages/UserSelectionBubble';
import UserImageBubble from './messages/UserImageBubble';
import UserLocationBubble from './messages/UserLocationBubble';
import UserDateTimeBubble from './messages/UserDateTimeBubble';
import UserActionCategoryBubble from './messages/UserActionCategoryBubble';
import UserActionAnswerBubble from './messages/UserActionAnswerBubble';
import SystemStatusBubble from './messages/SystemStatusBubble';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  switch (message.sender) {
    case 'bot':
      switch (message.type) {
        case 'text':
          return <BotTextBubble message={message} />;
        case 'options':
          return <BotOptionsBubble message={message} />;
        case 'file-upload-prompt':
          return (
            <BotTextBubble
              message={{ ...message, type: 'text', sender: 'bot' }}
            />
          );
        case 'location-prompt':
          return (
            <BotTextBubble
              message={{ ...message, type: 'text', sender: 'bot' }}
            />
          );
        case 'confirmation':
          return (
            <BotTextBubble
              message={{ ...message, type: 'text', sender: 'bot' }}
            />
          );
        case 'image-analysis-description':
          return <BotImageAnalysisDescriptionBubble message={message} />;
        case 'report-draft':
          return <BotReportDraftBubble message={message} />;
        case 'action-category-options':
          return <BotActionCategoryOptionsBubble message={message} />;
        case 'action-question':
          return <BotActionQuestionBubble message={message} />;
        case 'action-detail':
          return <BotActionDetailBubble message={message} />;
        case 'nearby-landmarks':
          return (
            <BotTextBubble
              message={{ ...message, type: 'text', sender: 'bot' }}
            />
          );
        default:
          return null;
      }

    case 'user':
      switch (message.type) {
        case 'text':
          return (
            <div className="flex items-start justify-end">
              <div className={`
                max-w-[80%] rounded-2xl bg-blue-900 px-4 py-3 text-sm
                whitespace-pre-wrap text-white
              `}>
                {message.content}
              </div>
            </div>
          );
        case 'selection':
          return <UserSelectionBubble message={message} />;
        case 'image':
          return <UserImageBubble message={message} />;
        case 'location':
          return <UserLocationBubble message={message} />;
        case 'datetime':
          return <UserDateTimeBubble message={message} />;
        case 'action-category':
          return <UserActionCategoryBubble message={message} />;
        case 'action-answer':
          return <UserActionAnswerBubble message={message} />;
        case 'nearby-landmark':
          return (
            <div className="flex items-start justify-end">
              <div className={`
                max-w-[80%] rounded-2xl bg-blue-900 px-4 py-3 text-sm text-white
              `}>
                {message.landmark ? (
                  <div>
                    <span className="font-medium">{message.landmark.name}</span>
                    <span className="ml-2 text-blue-200">
                      ({message.landmark.distance}m)
                    </span>
                  </div>
                ) : (
                  '該当なし'
                )}
              </div>
            </div>
          );
        default:
          return null;
      }

    case 'system':
      return <SystemStatusBubble message={message} />;

    default:
      return null;
  }
};

export default ChatMessage;
