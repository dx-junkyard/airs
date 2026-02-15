'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faHeadset } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import useHelpChatbot from '@/features/help-chatbot/hooks/useHelpChatbot';
import AdminChatbotMessageList from '@/features/admin-chatbot/components/AdminChatbotMessageList';
import AdminChatbotInput from '@/features/admin-chatbot/components/AdminChatbotInput';
import DynamicSuggestions from '@/components/ui/Chat/DynamicSuggestions/DynamicSuggestions';
import SuggestedQuestionsEmptyState from '@/components/ui/Chat/SuggestedQuestionsEmptyState/SuggestedQuestionsEmptyState';

/**
 * 一般利用者向けヘルプチャットボットサイドバー
 *
 * 右下のフローティングボタンとスライドインするサイドバーチャット
 * 管理者向け機能の説明を含まない、一般利用者向けのヘルプを提供
 */
export const HelpChatbotSidebar: React.FC = () => {
  const {
    isOpen,
    messages,
    input,
    isLoading,
    isChatStarted,
    suggestedQuestions,
    dynamicSuggestions,
    isFetchingSuggestions,
    handleInputChange,
    handleSubmit,
    handleResetConversation,
    handleSuggestionClick,
    toggleOpen,
    handleClose,
  } = useHelpChatbot();

  const footerContent =
    !isLoading && (isFetchingSuggestions || dynamicSuggestions.length > 0) ? (
      <DynamicSuggestions
        suggestions={dynamicSuggestions}
        isLoading={isFetchingSuggestions}
        onSuggestionClick={handleSuggestionClick}
      />
    ) : null;

  return (
    <>
      {/* フローティングボタン */}
      <button
        type="button"
        onClick={toggleOpen}
        className={`
          fixed right-6 bottom-6 z-50 m-0! flex size-14 items-center
          justify-center rounded-full bg-blue-800 text-white shadow-lg
          transition-all
          hover:bg-blue-700 hover:shadow-xl
          active:scale-95
        `}
        aria-label="ヘルプチャットを開く"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <FontAwesomeIcon icon={faXmark} className="size-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <FontAwesomeIcon icon={faHeadset} className="size-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* オーバーレイ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] m-0! bg-black/20"
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      {/* サイドバー */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              fixed top-0 right-0 z-[9999] m-0! flex size-full flex-col border-l
              border-solid-gray-200 bg-white shadow-2xl
              sm:w-[400px]
            `}
          >
            {/* ヘッダー */}
            <div
              className={`
                flex items-center gap-3 border-b border-solid-gray-200 px-4 py-3
              `}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className={`
                    flex size-8 shrink-0 items-center justify-center
                    rounded-full bg-blue-800 text-white
                  `}
                >
                  <FontAwesomeIcon icon={faHeadset} className="size-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-solid-gray-900">
                    ヘルプアシスタント
                  </h2>
                  <p className="text-xs text-solid-gray-500">
                    使い方について質問できます
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className={`
                  flex size-8 shrink-0 items-center justify-center rounded-lg
                  text-solid-gray-500 transition-colors
                  hover:bg-solid-gray-100 hover:text-solid-gray-700
                `}
                aria-label="閉じる"
              >
                <FontAwesomeIcon icon={faXmark} className="size-4" />
              </button>
            </div>

            {/* チャットエリア */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {!isChatStarted ? (
                <div className={`
                  flex h-full flex-col items-center justify-center px-4
                `}>
                  <SuggestedQuestionsEmptyState
                    icon={faHeadset}
                    iconBgClassName="bg-blue-100"
                    iconClassName="text-blue-800"
                    title="ヘルプアシスタント"
                    description="使い方について質問できます"
                    suggestedQuestions={suggestedQuestions}
                    onSuggestionClick={handleSuggestionClick}
                  />
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <AdminChatbotMessageList
                    messages={messages}
                    isLoading={isLoading}
                    footerContent={footerContent}
                  />
                </div>
              )}
            </div>

            {/* 入力エリア */}
            <div className="border-t border-solid-gray-200">
              <AdminChatbotInput
                input={input}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                onResetConversation={handleResetConversation}
                isLoading={isLoading}
                canResetConversation={isChatStarted}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HelpChatbotSidebar;
