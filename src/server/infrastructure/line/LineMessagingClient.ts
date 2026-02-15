import { messagingApi } from '@line/bot-sdk';

import { lineConfig } from '@/server/infrastructure/line/lineConfig';

/**
 * LINE Messaging APIクライアントラッパー
 *
 * reply / push メッセージ送信と画像バイナリ取得を提供
 */
class LineMessagingClient {
  private client: messagingApi.MessagingApiClient;
  private blobClient: messagingApi.MessagingApiBlobClient;

  constructor() {
    this.client = new messagingApi.MessagingApiClient({
      channelAccessToken: lineConfig.channelAccessToken,
    });
    this.blobClient = new messagingApi.MessagingApiBlobClient({
      channelAccessToken: lineConfig.channelAccessToken,
    });
  }

  /**
   * Reply Tokenを使ってメッセージを返信
   */
  async reply(
    replyToken: string,
    messages: messagingApi.Message[]
  ): Promise<void> {
    if (messages.length === 0) return;
    await this.client.replyMessage({
      replyToken,
      messages,
    });
  }

  /**
   * Push Messageでメッセージを送信
   */
  async push(
    lineUserId: string,
    messages: messagingApi.Message[]
  ): Promise<void> {
    if (messages.length === 0) return;
    // LINE APIは1回のpushで最大5メッセージ
    const chunks: messagingApi.Message[][] = [];
    for (let i = 0; i < messages.length; i += 5) {
      chunks.push(messages.slice(i, i + 5));
    }
    for (const chunk of chunks) {
      await this.client.pushMessage({
        to: lineUserId,
        messages: chunk,
      });
    }
  }

  /**
   * メッセージを既読にする
   */
  async markAsRead(markAsReadToken: string): Promise<void> {
    try {
      await this.client.markMessagesAsReadByToken({ markAsReadToken });
    } catch (error) {
      // 既読処理の失敗は致命的ではないのでログのみ
      console.warn('[LINE] markAsRead failed:', error);
    }
  }

  /**
   * LINE上の画像をバイナリで取得
   */
  async getMessageContent(messageId: string): Promise<Readable> {
    const response = await this.blobClient.getMessageContent(messageId);
    return response as unknown as Readable;
  }
}

// Node.js Readable stream import
import type { Readable } from 'stream';

export default LineMessagingClient;
