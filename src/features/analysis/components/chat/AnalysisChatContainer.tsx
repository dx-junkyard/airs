'use client';

import React from 'react';
import { faCircleNodes } from '@fortawesome/free-solid-svg-icons';
import ChatContainer from '@/components/ui/Chat/ChatContainer/ChatContainer';
import SuggestedQuestionsEmptyState from '@/components/ui/Chat/SuggestedQuestionsEmptyState/SuggestedQuestionsEmptyState';
import AnalysisChatMessageList from './AnalysisChatMessageList';
import AnalysisChatInput from './AnalysisChatInput';
import DynamicSuggestions from '@/components/ui/Chat/DynamicSuggestions/DynamicSuggestions';
import useAnalysisChat from '@/features/analysis/hooks/useAnalysisChat';
import type { LayerContext } from '@/features/analysis/hooks/useAnalysisChat';

interface AnalysisChatContainerProps {
  suggestedQuestions?: string[];
  layerContext?: LayerContext;
  onFilterChange?: (filters: Record<string, unknown>) => void;
}

export const AnalysisChatContainer: React.FC<AnalysisChatContainerProps> = ({
  suggestedQuestions: suggestedQuestionsProp,
  layerContext,
  onFilterChange,
}) => {
  const {
    messages,
    input,
    isLoading,
    error,
    isChatStarted,
    showSuggestions,
    suggestedQuestions,
    dynamicSuggestions,
    isFetchingSuggestions,
    handleInputChange,
    handleSubmit,
    handleResetConversation,
    handleSuggestionClick,
  } = useAnalysisChat(layerContext, onFilterChange);

  const effectiveQuestions = suggestedQuestionsProp ?? suggestedQuestions;

  const inputArea = (
    <div className="w-full">
      <AnalysisChatInput
        input={input}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onResetConversation={handleResetConversation}
        isLoading={isLoading}
        canResetConversation={isChatStarted}
      />
    </div>
  );

  // Dynamic suggestions footer - show only when not loading and after AI response
  const footerContent =
    !isLoading && (isFetchingSuggestions || dynamicSuggestions.length > 0) ? (
      <DynamicSuggestions
        suggestions={dynamicSuggestions}
        isLoading={isFetchingSuggestions}
        onSuggestionClick={handleSuggestionClick}
      />
    ) : null;

  return (
    <ChatContainer
      inputArea={inputArea}
      emptyState={
        <SuggestedQuestionsEmptyState
          icon={faCircleNodes}
          iconBgClassName="bg-green-100"
          iconClassName="text-green-700"
          title="分析AI"
          description="通報データに基づいて、AIが地理的な傾向やパターンを分析します。気になる点をAIに尋ねてみましょう。"
          suggestedQuestions={effectiveQuestions}
          onSuggestionClick={handleSuggestionClick}
          hoverClassName="hover:border-green-300 hover:bg-green-50"
        />
      }
      showEmptyState={!isChatStarted && showSuggestions}
    >
      <AnalysisChatMessageList
        messages={messages}
        isLoading={isLoading}
        footerContent={footerContent}
      />
      {error && (
        <div
          className={`
            mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3
            text-sm text-red-700
          `}
        >
          サーバが混み合っています。しばらく待ってから再度お試しください。
        </div>
      )}
    </ChatContainer>
  );
};

export default AnalysisChatContainer;
