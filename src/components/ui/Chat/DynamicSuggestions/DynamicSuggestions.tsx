'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';

interface DynamicSuggestionsProps {
  suggestions: string[];
  isLoading: boolean;
  onSuggestionClick: (question: string) => void;
}

/**
 * DynamicSuggestions
 *
 * AIの回答後に表示される動的なおすすめ質問コンポーネント
 */
export const DynamicSuggestions: React.FC<DynamicSuggestionsProps> = ({
  suggestions,
  isLoading,
  onSuggestionClick,
}) => {
  // ローディング中でもサジェスションがない場合は表示しない
  if (!isLoading && suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 px-4 pb-2">
      <div className={`
        rounded-lg border border-solid-gray-100 bg-solid-gray-50 p-3
      `}>
        <div className="mb-2 flex items-center gap-2">
          <FontAwesomeIcon
            icon={faLightbulb}
            className="size-3.5 text-yellow-500"
          />
          <span className="text-xs font-medium text-solid-gray-600">
            次のおすすめ質問
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-2">
            <div className="flex gap-1">
              <span className={`
                size-1.5 animate-bounce rounded-full bg-solid-gray-400
                [animation-delay:-0.3s]
              `} />
              <span className={`
                size-1.5 animate-bounce rounded-full bg-solid-gray-400
                [animation-delay:-0.15s]
              `} />
              <span className={`
                size-1.5 animate-bounce rounded-full bg-solid-gray-400
              `} />
            </div>
            <span className="text-xs text-solid-gray-500">
              質問を考えています...
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((question, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSuggestionClick(question)}
                className={`
                  rounded-full border border-solid-gray-200 bg-white px-3 py-1.5
                  text-xs text-solid-gray-700 transition-all duration-200
                  hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700
                  active:scale-95
                `}
              >
                {question}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicSuggestions;
