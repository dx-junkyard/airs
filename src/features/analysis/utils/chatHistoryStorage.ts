import type { UIMessage } from '@ai-sdk/react';

const STORAGE_KEY = 'analysis-chat-history';

/**
 * localStorageからチャット履歴を読み込む
 */
export function loadChatHistory(): UIMessage[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed as UIMessage[];
  } catch {
    return [];
  }
}

/**
 * チャット履歴をlocalStorageに保存する
 */
export function saveChatHistory(messages: UIMessage[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // localStorage容量超過時は古い履歴を無視
  }
}

/**
 * localStorageからチャット履歴を削除する
 */
export function clearChatHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
