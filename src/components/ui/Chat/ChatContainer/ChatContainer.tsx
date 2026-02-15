'use client';

import React from 'react';
import { chatContainerStyles } from '@/components/ui/Chat/styles';

interface ChatContainerProps {
  /** メッセージエリア（children） */
  children: React.ReactNode;
  /** ヘッダーエリア */
  headerArea?: React.ReactNode;
  /** 入力エリア */
  inputArea?: React.ReactNode;
  /** メッセージがない時の表示 */
  emptyState?: React.ReactNode;
  /** 高さクラス。デフォルト: 'h-full' */
  heightClassName?: string;
  /** 最小高さクラス */
  minHeightClassName?: string;
  /** emptyStateを表示するかどうか */
  showEmptyState?: boolean;
}

/**
 * チャットコンテナコンポーネント
 *
 * メッセージエリアと入力エリアのレイアウトを提供
 */
export const ChatContainer: React.FC<ChatContainerProps> = ({
  children,
  headerArea,
  inputArea,
  emptyState,
  heightClassName = chatContainerStyles.height,
  minHeightClassName = chatContainerStyles.minHeight,
  showEmptyState = false,
}) => {
  if (showEmptyState && emptyState) {
    return (
      <div
        className={`
          ${chatContainerStyles.wrapper}
          ${heightClassName}
          ${minHeightClassName}
        `}
      >
        {/* ヘッダーエリア */}
        {headerArea}

        <div className="flex flex-1 flex-col items-center justify-center px-4">
          {emptyState}
        </div>

        {/* 入力エリア */}
        {inputArea && (
          <div className={chatContainerStyles.inputArea}>{inputArea}</div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        ${chatContainerStyles.wrapper}
        ${heightClassName}
        ${minHeightClassName}
      `}
    >
      {/* ヘッダーエリア */}
      {headerArea}

      {/* メッセージエリア */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* 入力エリア */}
      {inputArea && (
        <div className={chatContainerStyles.inputArea}>{inputArea}</div>
      )}
    </div>
  );
};

export default ChatContainer;
