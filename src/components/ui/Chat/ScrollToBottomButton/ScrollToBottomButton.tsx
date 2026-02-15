import React from 'react';

interface ScrollToBottomButtonProps {
  /** クリック時のハンドラ */
  onClick: () => void;
  /** ボタンの表示/非表示 */
  visible?: boolean;
}

/**
 * 最下部へスクロールするボタンコンポーネント
 */
export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  onClick,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        fixed right-8 bottom-24 flex size-10 items-center justify-center
        rounded-full bg-blue-900 text-white shadow-lg transition-all
        hover:bg-blue-800
        active:scale-95
      `}
      aria-label="最下部にスクロール"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-5"
      >
        <path d="M7 10l5 5 5-5z" />
      </svg>
    </button>
  );
};

export default ScrollToBottomButton;
