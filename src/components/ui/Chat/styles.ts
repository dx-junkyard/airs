/**
 * チャットUIコンポーネント共通スタイル定数
 */

// チャットバブル
export const chatBubbleStyles = {
  base: 'rounded-2xl px-4 py-3 text-sm',
  bot: 'bg-solid-gray-50 text-solid-gray-900',
  user: 'bg-blue-900 text-white',
  maxWidth: 'max-w-[80%]',
} as const;

// コンテナ
export const chatContainerStyles = {
  wrapper: 'flex flex-col',
  height: 'h-full',
  minHeight: '',
  inputArea: 'shrink-0 border-t border-solid-gray-200 bg-white',
} as const;

// メッセージリスト
export const messageListStyles = {
  container: 'h-full overflow-y-auto p-4',
  inner: 'mx-auto space-y-4',
  maxWidth: 'max-w-3xl',
} as const;

// アバター
export const avatarStyles = {
  base: 'flex shrink-0 items-center justify-center rounded-full text-white',
  size: 'size-8',
  iconSize: 'size-4',
} as const;

// タイピングインジケータ
export const typingStyles = {
  dot: 'size-2 animate-bounce rounded-full bg-solid-gray-400',
  delays: ['[animation-delay:-0.3s]', '[animation-delay:-0.15s]', ''] as const,
} as const;

// プライマリボタン
export const primaryButtonStyles = {
  base: 'w-full rounded-lg bg-blue-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-800 active:scale-95',
  disabled: 'disabled:cursor-not-allowed disabled:opacity-50',
} as const;

// セカンダリボタン
export const secondaryButtonStyles = {
  base: 'w-full rounded-lg border border-solid-gray-300 bg-white px-6 py-3 text-sm font-medium text-solid-gray-900 transition-colors hover:bg-solid-gray-50 active:scale-95',
  disabled: 'disabled:cursor-not-allowed disabled:opacity-50',
} as const;
