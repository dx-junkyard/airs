import { atom } from 'jotai';

/**
 * Admin Chatbot Atoms
 *
 * 管理者ヘルプチャットボットのUI状態管理
 */

/**
 * サイドバーの開閉状態
 */
export const isChatbotOpenAtom = atom<boolean>(false);

/**
 * 動的に生成されたおすすめ質問
 */
export const adminDynamicSuggestionsAtom = atom<string[]>([]);

/**
 * おすすめ質問を取得中かどうか
 */
export const adminIsFetchingSuggestionsAtom = atom<boolean>(false);
