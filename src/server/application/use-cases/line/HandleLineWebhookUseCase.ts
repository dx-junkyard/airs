import type { ILineSessionRepository } from '@/server/domain/repositories/ILineSessionRepository';
import LineConversationService from '@/features/line-bot/services/LineConversationService';
import type { LineEventInput } from '@/features/line-bot/types/lineMessages';
import type LineMessagingClient from '@/server/infrastructure/line/LineMessagingClient';

/**
 * LINE Webhookイベント処理ユースケース
 *
 * Webhookから受け取ったイベントを処理し、
 * セッション管理と返信メッセージ送信を行う
 */
class HandleLineWebhookUseCase {
  private conversationService: LineConversationService;

  constructor(
    private sessionRepo: ILineSessionRepository,
    private lineClient: LineMessagingClient
  ) {
    this.conversationService = new LineConversationService(
      sessionRepo,
      lineClient
    );
  }

  /**
   * 単一イベントを処理
   */
  async execute(
    lineUserId: string,
    replyToken: string,
    event: LineEventInput
  ): Promise<void> {
    // セッション取得 or 新規作成
    const session = await this.sessionRepo.findByLineUserId(lineUserId);

    if (!session) {
      // 新しいセッション → 最初の質問を返す
      const response =
        await this.conversationService.startNewSession(lineUserId);
      await this.lineClient.reply(replyToken, response.replyMessages);
      return;
    }

    // 既存セッション → イベント処理
    const response = await this.conversationService.processEvent(
      session,
      event
    );

    if (response.replyMessages.length === 0) return;
    await this.lineClient.reply(replyToken, response.replyMessages);
  }
}

export default HandleLineWebhookUseCase;
