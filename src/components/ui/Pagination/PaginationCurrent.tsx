'use client';

import { useState, useCallback } from 'react';

export type PaginationCurrentProps = {
  current: number;
  max: number;
  onPageChange?: (page: number) => void;
};

const PaginationCurrent = (props: PaginationCurrentProps) => {
  const { current, max, onPageChange } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(current));

  // 編集モード時は入力値を使用、それ以外は外部のcurrentを表示値として使用
  const displayValue = isEditing ? inputValue : String(current);

  // 編集モード開始時にinput要素にフォーカス＆全選択
  const editingInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      if (node && isEditing) {
        node.focus();
        node.select();
      }
    },
    [isEditing],
  );

  const handleSubmit = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= max && parsed !== current) {
      onPageChange?.(parsed);
    }
    setIsEditing(false);
    setInputValue(String(current));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue(String(current));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleClick = () => {
    if (onPageChange) {
      setInputValue(String(current));
      setIsEditing(true);
    }
  };

  if (isEditing) {
    return (
      <span className="text-[calc(12/16*1rem)] leading-normal">
        <input
          ref={editingInputRef}
          type="number"
          min={1}
          max={max}
          value={displayValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSubmit}
          className={`
            w-16
            [appearance:textfield]
            rounded border border-solid-gray-300 bg-white text-center
            text-[calc(12/16*1rem)] leading-normal
            focus:border-blue-600 focus:outline-none
            [&::-webkit-inner-spin-button]:appearance-none
            [&::-webkit-outer-spin-button]:appearance-none
          `}
          aria-label="ページ番号を入力"
        />{' '}
        / {max}
      </span>
    );
  }

  return (
    <span className="text-[calc(12/16*1rem)] leading-normal">
      <span
        aria-current="page"
        role={onPageChange ? 'button' : undefined}
        tabIndex={onPageChange ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={
          onPageChange
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick();
                }
              }
            : undefined
        }
        className={
          onPageChange
            ? `
              cursor-pointer rounded px-1
              hover:bg-blue-50 hover:text-blue-900
              focus-visible:outline-2 focus-visible:outline-focus-yellow
            `
            : ''
        }
        title={onPageChange ? 'クリックでページ番号を入力' : undefined}
      >
        {current}
      </span>{' '}
      / {max}
    </span>
  );
};

export default PaginationCurrent;
