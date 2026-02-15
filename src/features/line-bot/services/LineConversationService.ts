import { createInitialSessionState } from '@/features/line-bot/types/lineSession';
import type {
  LineEventInput,
  LineResponseMessages,
} from '@/features/line-bot/types/lineMessages';
import type {
  ILineSessionRepository,
  LineSessionData,
} from '@/server/domain/repositories/ILineSessionRepository';
import { parsePostbackData } from '@/features/line-bot/utils/postbackParser';
import { ACTION_START_OVER } from '@/features/line-bot/constants/postbackActions';
import {
  buildAnimalTypeMessage,
  textMessage,
} from '@/features/line-bot/services/LineMessageBuilder';
import type LineMessagingClient from '@/server/infrastructure/line/LineMessagingClient';
import type { IStepHandler } from '@/features/line-bot/services/handlers/IStepHandler';
import AnimalTypeHandler from '@/features/line-bot/services/handlers/AnimalTypeHandler';
import PhotoHandler from '@/features/line-bot/services/handlers/PhotoHandler';
import ActionDetailHandler from '@/features/line-bot/services/handlers/ActionDetailHandler';
import DateTimeHandler from '@/features/line-bot/services/handlers/DateTimeHandler';
import LocationHandler from '@/features/line-bot/services/handlers/LocationHandler';
import ConfirmHandler from '@/features/line-bot/services/handlers/ConfirmHandler';

/**
 * LINE会話フローサービス
 *
 * ステートマシンで各ステップのイベント処理を行い、
 * セッション更新と返信メッセージを返す。
 * 各ステップの処理は専用ハンドラーに委譲する。
 */
class LineConversationService {
  private animalTypeHandler: AnimalTypeHandler;
  private photoHandler: PhotoHandler;
  private actionDetailHandler: ActionDetailHandler;
  private dateTimeHandler: DateTimeHandler;
  private locationHandler: LocationHandler;
  private confirmHandler: ConfirmHandler;

  private handlerMap: Record<string, IStepHandler>;

  constructor(
    private sessionRepo: ILineSessionRepository,
    lineClient: LineMessagingClient
  ) {
    this.animalTypeHandler = new AnimalTypeHandler(sessionRepo);
    this.photoHandler = new PhotoHandler(sessionRepo, lineClient);
    this.actionDetailHandler = new ActionDetailHandler(sessionRepo);
    this.dateTimeHandler = new DateTimeHandler(sessionRepo);
    this.locationHandler = new LocationHandler(sessionRepo);
    this.confirmHandler = new ConfirmHandler(sessionRepo, this.locationHandler);

    this.handlerMap = {
      'animal-type': this.animalTypeHandler,
      'photo': this.photoHandler,
      'image-description': this.photoHandler,
      'action-category': this.actionDetailHandler,
      'action-question': this.actionDetailHandler,
      'action-detail-confirm': this.actionDetailHandler,
      'datetime': this.dateTimeHandler,
      'location': this.locationHandler,
      'confirm': this.confirmHandler,
      'phone-number': this.confirmHandler,
    };
  }

  /**
   * イベントを処理してメッセージを返す
   */
  async processEvent(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages> {
    // "リセット" テキストでセッション終了
    if (event.type === 'message' && event.text) {
      const normalized = event.text.trim().toLowerCase();
      if (normalized === 'リセット' || normalized === 'reset') {
        return this.handleReset(session.lineUserId);
      }
    }

    // start_over postbackはどのステップでも処理
    if (event.type === 'postback' && event.postbackData) {
      const payload = parsePostbackData(event.postbackData);
      if (payload.action === ACTION_START_OVER) {
        return this.handleStartOver(session.lineUserId);
      }
    }

    const handler = this.handlerMap[session.step];
    if (handler) {
      return handler.handle(session, event);
    }

    // complete or unknown step
    return this.handleStartOver(session.lineUserId);
  }

  /**
   * 新しいセッションを作成して最初の質問を返す
   */
  async startNewSession(lineUserId: string): Promise<LineResponseMessages> {
    const state = createInitialSessionState();
    await this.sessionRepo.save(lineUserId, 'animal-type', state);
    const enabledTypes = await this.animalTypeHandler.getEnabledAnimalTypes();
    return {
      replyMessages: [buildAnimalTypeMessage(enabledTypes)],
    };
  }

  private async handleReset(lineUserId: string): Promise<LineResponseMessages> {
    await this.sessionRepo.deleteByLineUserId(lineUserId);
    return {
      replyMessages: [
        textMessage(
          '通報を中断しました。\n再度通報する場合はメッセージを送信してください。'
        ),
      ],
    };
  }

  private async handleStartOver(
    lineUserId: string
  ): Promise<LineResponseMessages> {
    const state = createInitialSessionState();
    await this.sessionRepo.save(lineUserId, 'animal-type', state);
    const enabledTypes = await this.animalTypeHandler.getEnabledAnimalTypes();
    return {
      replyMessages: [buildAnimalTypeMessage(enabledTypes)],
    };
  }
}

export default LineConversationService;
