'use client';

import React, { useState, useCallback } from 'react';
import type {
  QuestionCard,
  QuestionChoice,
} from '@/features/ai-report/types/actionDetail';

interface ActionQuestionInputProps {
  question: QuestionCard;
  onAnswer: (
    questionId: string,
    selectedChoices: QuestionChoice[],
    otherText?: string
  ) => void;
  isProcessing?: boolean;
}

export const ActionQuestionInput: React.FC<ActionQuestionInputProps> = ({
  question,
  onAnswer,
  isProcessing = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [otherText, setOtherText] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  const handleChoiceClick = useCallback(
    (choice: QuestionChoice) => {
      if (question.choiceType === 'single') {
        // 単一選択: 既存の選択をクリアして新しい選択
        if (choice.id === 'other') {
          setShowOtherInput(true);
          setSelectedIds(new Set(['other']));
        } else {
          setShowOtherInput(false);
          setSelectedIds(new Set([choice.id]));
        }
      } else {
        // 複数選択: トグル
        const newSelected = new Set(selectedIds);
        if (choice.id === 'other') {
          if (newSelected.has('other')) {
            newSelected.delete('other');
            setShowOtherInput(false);
          } else {
            newSelected.add('other');
            setShowOtherInput(true);
          }
        } else {
          if (newSelected.has(choice.id)) {
            newSelected.delete(choice.id);
          } else {
            newSelected.add(choice.id);
          }
        }
        setSelectedIds(newSelected);
      }
    },
    [question.choiceType, selectedIds]
  );

  const handleSubmit = useCallback(() => {
    if (selectedIds.size === 0) return;

    const selectedChoices = question.choices.filter((c) =>
      selectedIds.has(c.id)
    );

    // 「その他」が選択されている場合、otherTextも送信
    const finalOtherText =
      selectedIds.has('other') && otherText.trim() ? otherText.trim() : undefined;

    onAnswer(question.questionId, selectedChoices, finalOtherText);
  }, [selectedIds, question, otherText, onAnswer]);

  const isSubmitDisabled =
    selectedIds.size === 0 ||
    isProcessing ||
    (selectedIds.has('other') && !otherText.trim());

  return (
    <div className="space-y-4">
      {/* 質問文 */}
      <p className="text-center text-sm font-medium text-solid-gray-800">
        {question.questionText}
      </p>

      {/* 選択肢 */}
      <div className="flex flex-wrap justify-center gap-2">
        {question.choices.map((choice) => {
          const isSelected = selectedIds.has(choice.id);
          return (
            <button
              key={choice.id}
              onClick={() => handleChoiceClick(choice)}
              disabled={isProcessing}
              className={`
                rounded-lg border px-4 py-2 text-sm font-medium transition-all
                ${
                  isSelected
                    ? 'border-blue-900 bg-blue-900 text-white'
                    : `
                      border-solid-gray-200 bg-white text-solid-gray-900
                      hover:border-blue-900 hover:bg-blue-50
                    `
                }
                ${isProcessing ? 'cursor-not-allowed opacity-50' : `
                  active:scale-95
                `}
              `}
            >
              {choice.label}
            </button>
          );
        })}

        {/* 「その他」ボタン（allowOtherがtrueの場合） */}
        {question.allowOther && (
          <button
            onClick={() =>
              handleChoiceClick({ id: 'other', label: 'その他（入力）' })
            }
            disabled={isProcessing}
            className={`
              rounded-lg border px-4 py-2 text-sm font-medium transition-all
              ${
                selectedIds.has('other')
                  ? 'border-blue-900 bg-blue-900 text-white'
                  : `
                    border-solid-gray-200 bg-white text-solid-gray-900
                    hover:border-blue-900 hover:bg-blue-50
                  `
              }
              ${isProcessing ? 'cursor-not-allowed opacity-50' : `
                active:scale-95
              `}
            `}
          >
            その他（入力）
          </button>
        )}
      </div>

      {/* 「その他」の自由入力欄 */}
      {showOtherInput && (
        <div className="mx-auto max-w-md">
          <input
            type="text"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="具体的に入力してください"
            disabled={isProcessing}
            className={`
              w-full rounded-lg border border-solid-gray-300 px-4 py-2 text-sm
              focus:border-blue-900 focus:ring-1 focus:ring-blue-900
              focus:outline-none
              ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}
            `}
          />
        </div>
      )}

      {/* 送信ボタン */}
      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className={`
            rounded-lg bg-blue-900 px-6 py-2 text-sm font-medium text-white
            transition-all
            ${
              isSubmitDisabled
                ? 'cursor-not-allowed opacity-50'
                : `
                  hover:bg-blue-800
                  active:scale-95
                `
            }
          `}
        >
          {isProcessing ? '処理中...' : '次へ'}
        </button>
      </div>

      {/* 選択タイプの説明 */}
      {question.choiceType === 'multiple' && (
        <p className="text-center text-xs text-solid-gray-500">
          複数選択できます
        </p>
      )}
    </div>
  );
};

export default ActionQuestionInput;
