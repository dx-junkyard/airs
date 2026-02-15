import type {
  LineEventInput,
  LineResponseMessages,
} from '@/features/line-bot/types/lineMessages';
import type { LineSessionState } from '@/features/line-bot/types/lineSession';
import type {
  ILineSessionRepository,
  LineSessionData,
} from '@/server/domain/repositories/ILineSessionRepository';
import { parsePostbackData } from '@/features/line-bot/utils/postbackParser';
import {
  ACTION_DATETIME_NOW,
  ACTION_SELECT_DATETIME,
} from '@/features/line-bot/constants/postbackActions';
import {
  buildDateTimeMessage,
  buildLocationMessage,
  textMessage,
} from '@/features/line-bot/services/LineMessageBuilder';
import type { IStepHandler } from '@/features/line-bot/services/handlers/IStepHandler';

/**
 * Step 4: 日時入力ハンドラー
 */
class DateTimeHandler implements IStepHandler {
  constructor(private sessionRepo: ILineSessionRepository) {}

  async handle(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages> {
    if (event.type === 'postback' && event.postbackData) {
      const payload = parsePostbackData(event.postbackData);

      if (payload.action === ACTION_DATETIME_NOW) {
        const now = new Date();
        const newState: LineSessionState = {
          ...session.state,
          dateTime: now.toISOString(),
        };
        await this.sessionRepo.save(session.lineUserId, 'location', newState);
        const formattedDateTime = now.toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        return {
          replyMessages: [
            textMessage(`📅 ${formattedDateTime} を選択しました。`),
            buildLocationMessage(),
          ],
        };
      }

      if (
        payload.action === ACTION_SELECT_DATETIME &&
        event.postbackParams?.datetime
      ) {
        const dt = new Date(event.postbackParams.datetime);
        const newState: LineSessionState = {
          ...session.state,
          dateTime: dt.toISOString(),
        };
        await this.sessionRepo.save(session.lineUserId, 'location', newState);
        const formattedDateTime = dt.toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        return {
          replyMessages: [
            textMessage(`📅 ${formattedDateTime} を選択しました。`),
            buildLocationMessage(),
          ],
        };
      }
    }

    return {
      replyMessages: [buildDateTimeMessage()],
    };
  }
}

export default DateTimeHandler;
