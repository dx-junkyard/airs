'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollToBottomButton from '@/components/ui/Chat/ScrollToBottomButton/ScrollToBottomButton';
import { messageListStyles } from '@/components/ui/Chat/styles';

interface ChatMessageListProps<T> {
  /** メッセージ配列 */
  messages: T[];
  /** メッセージのレンダリング関数 */
  renderMessage: (message: T, index: number) => React.ReactNode;
  /** メッセージのキー取得関数 */
  getMessageKey: (message: T) => string;
  /** ローディング中かどうか */
  isLoading?: boolean;
  /** ローディング中に表示するインジケータ */
  loadingIndicator?: React.ReactNode;
  /** スクロールボタンを表示するかどうか */
  showScrollButton?: boolean;
  /** 最大幅クラス。デフォルト: 'max-w-3xl' */
  maxWidthClassName?: string;
  /** メッセージリスト下部に表示する追加コンテンツ */
  footerContent?: React.ReactNode;
}

/**
 * チャットメッセージリストコンポーネント
 *
 * AnimatePresenceによるアニメーション、自動スクロール、スクロールボタン機能を内蔵
 */
export function ChatMessageList<T>({
  messages,
  renderMessage,
  getMessageKey,
  isLoading = false,
  loadingIndicator,
  showScrollButton = true,
  maxWidthClassName = messageListStyles.maxWidth,
  footerContent,
}: ChatMessageListProps<T>): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showButton, setShowButton] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Detect if user has scrolled up
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowButton(!isNearBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`
        relative
        ${messageListStyles.container}
      `}
    >
      <div
        className={`
          ${messageListStyles.inner}
          ${maxWidthClassName}
        `}
      >
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={getMessageKey(message)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderMessage(message, index)}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && loadingIndicator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {loadingIndicator}
          </motion.div>
        )}

        {/* Footer content (e.g., suggested questions) */}
        {footerContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {footerContent}
          </motion.div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <ScrollToBottomButton onClick={scrollToBottom} visible={showButton} />
      )}
    </div>
  );
}

export default ChatMessageList;
