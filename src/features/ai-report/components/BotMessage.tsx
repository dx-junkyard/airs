'use client';

interface BotMessageProps {
  message: string;
  className?: string;
}

/**
 * ボットメッセージコンポーネント
 * システムからのメッセージを表示
 */
export const BotMessage = ({ message, className = '' }: BotMessageProps) => {
  return (
    <div
      className={`
        flex items-start gap-3
        ${className}
      `}
    >
      {/* ボットアイコン */}
      <div
        className={`
          flex size-10 flex-shrink-0 items-center justify-center rounded-full
          bg-blue-100
        `}
      >
        <svg
          className="size-6 text-blue-900"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </div>

      {/* メッセージバブル */}
      <div className="flex-1 rounded-lg bg-solid-gray-50 p-4">
        <p className="whitespace-pre-wrap text-solid-gray-800">{message}</p>
      </div>
    </div>
  );
};
