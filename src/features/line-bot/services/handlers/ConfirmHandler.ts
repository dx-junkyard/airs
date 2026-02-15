import type { messagingApi } from '@line/bot-sdk';

import type {
  LineEventInput,
  LineResponseMessages,
} from '@/features/line-bot/types/lineMessages';
import type { LineSessionState } from '@/features/line-bot/types/lineSession';
import type {
  ILineSessionRepository,
  LineSessionData,
} from '@/server/domain/repositories/ILineSessionRepository';
import type { CreateReportDto } from '@/server/application/dtos/CreateReportDto';
import { parsePostbackData } from '@/features/line-bot/utils/postbackParser';
import {
  ACTION_SELECT_LANDMARK,
  ACTION_SKIP_LANDMARK,
  ACTION_CONFIRM_REPORT,
  ACTION_REQUEST_PHONE_NUMBER,
  ACTION_SKIP_PHONE_NUMBER,
} from '@/features/line-bot/constants/postbackActions';
import {
  buildReportDraftMessage,
  buildPhoneNumberPromptMessage,
  buildCompletionMessage,
  textMessage,
} from '@/features/line-bot/services/LineMessageBuilder';
import DIContainer from '@/server/infrastructure/di/container';
import { getAnimalTypeLabel } from '@/server/domain/constants/animalTypes';
import { generateReportToken } from '@/server/infrastructure/auth/reportToken';
import { getAppUrl } from '@/server/infrastructure/line/lineConfig';
import { formatLocationWithLandmark } from '@/features/ai-report/utils/locationFormatter';
import type LocationHandler from '@/features/line-bot/services/handlers/LocationHandler';
import type { IStepHandler } from '@/features/line-bot/services/handlers/IStepHandler';

/**
 * Step 6 + 6b + 7: 通報確認・電話番号・送信ハンドラー
 */
class ConfirmHandler implements IStepHandler {
  constructor(
    private sessionRepo: ILineSessionRepository,
    private locationHandler: LocationHandler
  ) {}

  async handle(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages> {
    const { step } = session;

    if (step === 'phone-number') {
      return this.handlePhoneNumber(session, event);
    }

    return this.handleConfirm(session, event);
  }

  /**
   * Step 6: 通報ドラフト確認
   */
  private async handleConfirm(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages> {
    if (event.type === 'postback' && event.postbackData) {
      const payload = parsePostbackData(event.postbackData);

      if (
        payload.action === ACTION_SELECT_LANDMARK ||
        payload.action === ACTION_SKIP_LANDMARK
      ) {
        return this.locationHandler.handleLandmarkSelection(session, payload);
      }

      if (payload.action === ACTION_CONFIRM_REPORT) {
        await this.sessionRepo.save(
          session.lineUserId,
          'phone-number',
          session.state
        );
        return {
          replyMessages: [buildPhoneNumberPromptMessage()],
        };
      }
    }

    // テキストメッセージ → ドラフトを再表示
    if (event.type === 'message' && event.text && session.state.reportDraft) {
      return {
        replyMessages: [buildReportDraftMessage(session.state.reportDraft)],
      };
    }

    if (session.state.reportDraft) {
      return {
        replyMessages: [buildReportDraftMessage(session.state.reportDraft)],
      };
    }

    return {
      replyMessages: [textMessage('通報内容を確認してください。')],
    };
  }

  /**
   * Step 6b: 電話番号入力
   */
  private async handlePhoneNumber(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages> {
    if (event.type === 'postback' && event.postbackData) {
      const payload = parsePostbackData(event.postbackData);
      if (payload.action === ACTION_REQUEST_PHONE_NUMBER) {
        return { replyMessages: [] };
      }
      if (payload.action === ACTION_SKIP_PHONE_NUMBER) {
        return {
          replyMessages: [
            textMessage('LINE通報で時間がかかる場合があります。'),
            textMessage('📤 通報を送信中です。'),
            ...(await this.submitReport(session)),
          ],
        };
      }
    }

    if (event.type === 'message' && event.text) {
      const input = event.text.trim();

      const digitsOnly = input.replace(/-/g, '');
      if (!/^0\d{9,10}$/.test(digitsOnly)) {
        return {
          replyMessages: [
            textMessage(
              '電話番号の形式が正しくありません。\n\n例: 090-1234-5678\n\nもう一度入力するか、「電話番号を送らない」を選択してください。'
            ),
            buildPhoneNumberPromptMessage(),
          ],
        };
      }

      const newState: LineSessionState = {
        ...session.state,
        phoneNumber: input,
      };
      await this.sessionRepo.save(
        session.lineUserId,
        'phone-number',
        newState
      );
      const updatedSession: LineSessionData = {
        ...session,
        state: newState,
      };

      return {
        replyMessages: [
          textMessage('LINE通報で時間がかかる場合があります。'),
          textMessage('📤 通報を送信中です。'),
          ...(await this.submitReport(updatedSession)),
        ],
      };
    }

    return {
      replyMessages: [buildPhoneNumberPromptMessage()],
    };
  }

  /**
   * 通報を送信
   */
  private async submitReport(
    session: LineSessionData
  ): Promise<messagingApi.Message[]> {
    try {
      const { state } = session;

      const formatDateTime = (isoString: string | undefined) => {
        if (!isoString) return '不明';
        const date = new Date(isoString);
        return date.toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      };

      const descriptionParts = [
        `いつ: ${formatDateTime(state.dateTime ?? undefined)}`,
        `どこで: ${formatLocationWithLandmark(state.location) || '不明'}`,
        `何が: ${getAnimalTypeLabel(state.animalType!)}`,
        state.situation ? `状況: ${state.situation}` : undefined,
      ].filter(Boolean);

      const dto: CreateReportDto = {
        animalType: state.animalType!,
        latitude: String(state.location?.latitude || 0),
        longitude: String(state.location?.longitude || 0),
        address: state.location?.address || '',
        normalizedAddress: state.location?.normalizedAddress,
        phoneNumber: state.phoneNumber || undefined,
        images: state.images ?? [],
        description: descriptionParts.join('\n'),
      };

      const service = DIContainer.getReportRegistrationService();
      const result = await service.execute(dto);

      let editUrl: string | undefined;
      try {
        const token = await generateReportToken(result.id);
        const baseUrl = getAppUrl();
        editUrl = `${baseUrl}/report?token=${token}`;
      } catch (error) {
        console.error('Failed to generate edit URL:', error);
      }

      let mapUrl: string | undefined;
      if (state.location) {
        const baseUrl = getAppUrl();
        const today = new Date();
        const endDate = today.toISOString().split('T')[0];
        const startDate = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          today.getDate()
        )
          .toISOString()
          .split('T')[0];
        mapUrl = `${baseUrl}/map?lat=${state.location.latitude}&lng=${state.location.longitude}&zoom=18&startDate=${startDate}&endDate=${endDate}`;
      }

      const newState: LineSessionState = {
        ...state,
      };
      await this.sessionRepo.save(session.lineUserId, 'complete', newState);

      return [buildCompletionMessage({ editUrl, mapUrl })];
    } catch (error) {
      console.error('Report submission error:', error);
      return [
        textMessage(
          '通報の送信中にエラーが発生しました。もう一度お試しください。'
        ),
        buildReportDraftMessage(session.state.reportDraft!),
      ];
    }
  }
}

export default ConfirmHandler;
