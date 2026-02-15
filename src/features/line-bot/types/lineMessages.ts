import type { messagingApi } from '@line/bot-sdk';

/**
 * LineConversationServiceが返すメッセージ群
 */
export interface LineResponseMessages {
  /** Reply Tokenで即座に返すメッセージ */
  replyMessages: messagingApi.Message[];
}

/**
 * LINE webhookイベントから抽出した情報
 */
export interface LineEventInput {
  type: 'message' | 'postback';
  /** テキストメッセージ内容 */
  text?: string;
  /** 画像メッセージID */
  imageMessageId?: string;
  /** 位置情報 */
  location?: {
    latitude: number;
    longitude: number;
  };
  /** Postback data（URL query string形式） */
  postbackData?: string;
  /** Postback params（datetimepicker等） */
  postbackParams?: {
    datetime?: string;
  };
}
