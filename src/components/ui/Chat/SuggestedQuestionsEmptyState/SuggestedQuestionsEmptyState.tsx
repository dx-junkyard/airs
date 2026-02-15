'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface SuggestedQuestionsEmptyStateProps {
  /** アイコン */
  icon: IconDefinition;
  /** アイコン背景色クラス（例: 'bg-green-100'） */
  iconBgClassName: string;
  /** アイコン色クラス（例: 'text-green-700'） */
  iconClassName: string;
  /** タイトル */
  title: string;
  /** 説明文 */
  description: string;
  /** おすすめ質問リスト */
  suggestedQuestions: string[];
  /** 質問クリック時のコールバック */
  onSuggestionClick: (question: string) => void;
  /** ホバー色クラス（例: 'hover:border-green-300 hover:bg-green-50'） */
  hoverClassName?: string;
}

/**
 * おすすめ質問の空状態コンポーネント
 *
 * チャット開始前に表示される、アイコン・タイトル・説明文・おすすめ質問リスト
 */
const SuggestedQuestionsEmptyState: React.FC<
  SuggestedQuestionsEmptyStateProps
> = ({
  icon,
  iconBgClassName,
  iconClassName,
  title,
  description,
  suggestedQuestions,
  onSuggestionClick,
  hoverClassName = 'hover:border-blue-300 hover:bg-blue-50',
}) => (
  <div className="text-center">
    <div className="mb-6">
      <div
        className={`
          mx-auto mb-4 flex size-16 items-center justify-center rounded-full
          ${iconBgClassName}
        `}
      >
        <FontAwesomeIcon
          icon={icon}
          className={`
            size-8! -translate-x-px
            ${iconClassName}
          `}
        />
      </div>
      <h2 className="mb-2 text-xl font-bold text-solid-gray-900">{title}</h2>
      <p className="text-sm text-solid-gray-600">{description}</p>
    </div>

    <div className="mx-auto max-w-md space-y-3">
      <p className="text-xs font-medium text-solid-gray-500">おすすめ質問</p>
      {suggestedQuestions.map((question, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSuggestionClick(question)}
          className={`
            w-full rounded-lg border border-solid-gray-200 bg-white px-4 py-3
            text-left text-sm text-solid-gray-700 transition-colors
            ${hoverClassName}
          `}
        >
          {question}
        </button>
      ))}
    </div>
  </div>
);

export default SuggestedQuestionsEmptyState;
