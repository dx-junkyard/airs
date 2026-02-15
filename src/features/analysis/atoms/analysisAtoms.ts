import { atom } from 'jotai';
import type { NearbyLandmarkDto } from '@/server/application/dtos/NearbyLandmarkDto';

/**
 * Analysis Chat Atoms
 *
 * 分析チャットのUI状態管理（メッセージはuseChatで管理）
 * 注: isChatStarted と showSuggestions は messages.length から派生計算されるため
 *     atoms として管理する必要がなくなりました（useAnalysisChat.ts参照）
 */

/**
 * 現在展開されているテーブル結果のID
 */
export const expandedTableIdAtom = atom<string | null>(null);

/**
 * 動的に生成されたおすすめ質問
 */
export const dynamicSuggestionsAtom = atom<string[]>([]);

/**
 * おすすめ質問を取得中かどうか
 */
export const isFetchingSuggestionsAtom = atom<boolean>(false);

/** 選択された（テーブルでクリックされた）地点 */
export const aiSelectedPointAtom = atom<{
  lat: number;
  lng: number;
  properties?: Record<string, any>;
} | null>(null);

/**
 * AIチャットでsearchLandmarks実行された結果データ（GIS表示用）
 * サーバー側から送信されたランドマーク情報を保持
 */
export const aiLandmarkResultsAtom = atom<NearbyLandmarkDto[]>([]);

/**
 * チャットリセット要求フラグ
 * trueにするとuseAnalysisChatがメッセージをクリアし、falseに戻す
 */
export const chatResetRequestAtom = atom<boolean>(false);

