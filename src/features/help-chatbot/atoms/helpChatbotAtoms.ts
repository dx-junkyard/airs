import { atom } from 'jotai';

/**
 * Help Chatbot Atoms
 *
 * 一般利用者向けヘルプチャットボットのUI状態管理
 */

/**
 * サイドバーの開閉状態
 */
export const isHelpChatbotOpenAtom = atom<boolean>(false);

/**
 * 動的に生成されたおすすめ質問
 */
export const helpDynamicSuggestionsAtom = atom<string[]>([]);

/**
 * おすすめ質問を取得中かどうか
 */
export const helpIsFetchingSuggestionsAtom = atom<boolean>(false);
