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
import { parsePostbackData } from '@/features/line-bot/utils/postbackParser';
import {
  ACTION_SKIP_PHOTO,
  ACTION_ADD_PHOTO,
  ACTION_CONFIRM_DESC,
  ACTION_REJECT_DESC,
} from '@/features/line-bot/constants/postbackActions';
import {
  buildPhotoPromptMessages,
  buildImageAnalysisDescriptionMessage,
  buildImageRejectedMessage,
  buildImageAddOrContinueMessage,
  buildDateTimeMessage,
  buildAddPhotoPromptMessage,
  textMessage,
} from '@/features/line-bot/services/LineMessageBuilder';
import { analyzeImageWithAI } from '@/features/ai-report/actions';
import { uploadLineImage } from '@/features/line-bot/services/LineImageService';
import { getAnimalTypeLabel } from '@/server/domain/constants/animalTypes';
import type LineMessagingClient from '@/server/infrastructure/line/LineMessagingClient';
import type { IStepHandler } from '@/features/line-bot/services/handlers/IStepHandler';

/**
 * Step 2 + 2a + 2b: 写真アップロード・解析ハンドラー
 */
class PhotoHandler implements IStepHandler {
  constructor(
    private sessionRepo: ILineSessionRepository,
    private lineClient: LineMessagingClient
  ) {}

  async handle(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages> {
    const { step } = session;

    if (step === 'image-description') {
      return this.handleImageDescription(session, event);
    }

    return this.handlePhoto(session, event);
  }

  /**
   * Step 2: 写真アップロード
   */
  private async handlePhoto(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages> {
    // スキップ
    if (event.type === 'postback' && event.postbackData) {
      const payload = parsePostbackData(event.postbackData);
      if (payload.action === ACTION_SKIP_PHOTO) {
        await this.sessionRepo.save(
          session.lineUserId,
          'datetime',
          session.state
        );
        return {
          replyMessages: [buildDateTimeMessage()],
        };
      }
      if (payload.action === ACTION_ADD_PHOTO) {
        return {
          replyMessages: [buildAddPhotoPromptMessage()],
        };
      }
    }

    // 画像メッセージの処理
    if (event.type === 'message' && event.imageMessageId) {
      const replyMessages = await this.processImageUpload(
        session,
        event.imageMessageId
      );
      return { replyMessages };
    }

    // その他のメッセージ → プロンプト再送
    return {
      replyMessages: buildPhotoPromptMessages(),
    };
  }

  /**
   * 画像アップロードとAI解析を実行
   */
  private async processImageUpload(
    session: LineSessionData,
    imageMessageId: string
  ): Promise<messagingApi.Message[]> {
    try {
      const imageUrl = await uploadLineImage(imageMessageId, this.lineClient);
      const analysisResult = await analyzeImageWithAI(imageUrl);

      if (!analysisResult.success) {
        const newState: LineSessionState = {
          ...session.state,
          images: [
            ...session.state.images,
            { url: imageUrl, description: '' },
          ],
        };
        await this.sessionRepo.save(session.lineUserId, 'photo', newState);
        return [
          textMessage(
            '画像の解析に失敗しました。別の写真を送信するか、「写真を持ってない」を選んでください。'
          ),
          ...buildPhotoPromptMessages(),
        ];
      }

      const skipScreening = session.state.imageRejectionCount >= 2;

      if (!skipScreening && !analysisResult.isImageClear) {
        const newState: LineSessionState = {
          ...session.state,
          images: [
            ...session.state.images,
            { url: imageUrl, description: analysisResult.description || '' },
          ],
          imageRejectionCount: session.state.imageRejectionCount + 1,
        };
        await this.sessionRepo.save(session.lineUserId, 'photo', newState);
        const rejectionMessage = analysisResult.description
          ? `写真が不鮮明で被写体を確認できませんでした。\n\n【AI解析】${analysisResult.description}\n\nもう少し明るい場所や近くから撮影してください`
          : '写真が不鮮明で被写体を確認できませんでした。もう少し明るい場所や近くから撮影してください';
        return [buildImageRejectedMessage(rejectionMessage)];
      }

      if (!skipScreening && !analysisResult.containsAnimalOrTrace) {
        const newState: LineSessionState = {
          ...session.state,
          images: [
            ...session.state.images,
            { url: imageUrl, description: analysisResult.description || '' },
          ],
          imageRejectionCount: session.state.imageRejectionCount + 1,
        };
        await this.sessionRepo.save(session.lineUserId, 'photo', newState);
        const rejectionMessage = analysisResult.description
          ? `動物や痕跡が確認できませんでした。\n\n【AI解析】${analysisResult.description}\n\n動物や被害の様子が写った写真を送信してください`
          : '動物や痕跡が確認できませんでした。動物や被害の様子が写った写真を送信してください';
        return [buildImageRejectedMessage(rejectionMessage)];
      }

      // 獣種一致チェック
      const selectedAnimal = session.state.animalType;
      if (
        !skipScreening &&
        selectedAnimal &&
        selectedAnimal !== 'other' &&
        analysisResult.detectedAnimalType &&
        analysisResult.detectedAnimalType !== 'other' &&
        analysisResult.detectedAnimalType !== selectedAnimal
      ) {
        const selectedLabel = getAnimalTypeLabel(selectedAnimal);
        const detectedLabel = getAnimalTypeLabel(
          analysisResult.detectedAnimalType
        );
        const newState: LineSessionState = {
          ...session.state,
          images: [
            ...session.state.images,
            { url: imageUrl, description: analysisResult.description || '' },
          ],
          imageRejectionCount: session.state.imageRejectionCount + 1,
        };
        await this.sessionRepo.save(session.lineUserId, 'photo', newState);
        return [
          buildImageRejectedMessage(
            `「${detectedLabel}」が写っているようですが、「${selectedLabel}」として通報されています`
          ),
        ];
      }

      // 合格 → 解説を表示してはい/いいえ確認
      const newState: LineSessionState = {
        ...session.state,
        images: [
          ...session.state.images,
          { url: imageUrl, description: analysisResult.description || '' },
        ],
        imageAnalysisDescription: analysisResult.description || null,
      };
      await this.sessionRepo.save(
        session.lineUserId,
        'image-description',
        newState
      );

      if (analysisResult.description) {
        return [
          buildImageAnalysisDescriptionMessage(analysisResult.description),
        ];
      }

      return [buildImageAddOrContinueMessage()];
    } catch (error) {
      console.error('Image processing error:', error);
      return [
        textMessage(
          '画像の処理中にエラーが発生しました。もう一度お試しください。'
        ),
        ...buildPhotoPromptMessages(),
      ];
    }
  }

  /**
   * Step 2b: 画像解説確認（はい/いいえ）
   */
  private async handleImageDescription(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages> {
    if (event.type === 'message' && event.text) {
      if (event.imageMessageId) {
        await this.sessionRepo.save(session.lineUserId, 'photo', session.state);
        return this.handlePhoto(session, event);
      }

      const correctionText = event.text;
      const aiDescription = session.state.imageAnalysisDescription || '';
      const correctedDescription = `${aiDescription}（補足: ${correctionText}）`;

      const newState: LineSessionState = {
        ...session.state,
        situation: correctedDescription,
      };

      await this.sessionRepo.save(session.lineUserId, 'photo', newState);
      return {
        replyMessages: [
          textMessage('ありがとうございます。'),
          buildImageAddOrContinueMessage(),
        ],
      };
    }

    if (event.type !== 'postback' || !event.postbackData) {
      if (session.state.imageAnalysisDescription) {
        return {
          replyMessages: [
            buildImageAnalysisDescriptionMessage(
              session.state.imageAnalysisDescription
            ),
          ],
        };
      }
      return {
        replyMessages: [buildImageAddOrContinueMessage()],
      };
    }

    const payload = parsePostbackData(event.postbackData);

    if (payload.action === ACTION_CONFIRM_DESC) {
      const situation = session.state.imageAnalysisDescription || '';
      const newState: LineSessionState = {
        ...session.state,
        situation,
      };
      await this.sessionRepo.save(session.lineUserId, 'photo', newState);
      return {
        replyMessages: [buildImageAddOrContinueMessage()],
      };
    }

    if (payload.action === ACTION_REJECT_DESC) {
      return {
        replyMessages: [textMessage('どのように違うか教えてください。')],
      };
    }

    if (payload.action === ACTION_SKIP_PHOTO) {
      await this.sessionRepo.save(
        session.lineUserId,
        'datetime',
        session.state
      );
      return {
        replyMessages: [buildDateTimeMessage()],
      };
    }

    if (payload.action === ACTION_ADD_PHOTO) {
      await this.sessionRepo.save(session.lineUserId, 'photo', session.state);
      return {
        replyMessages: [buildAddPhotoPromptMessage()],
      };
    }

    return {
      replyMessages: [buildImageAddOrContinueMessage()],
    };
  }
}

export default PhotoHandler;
