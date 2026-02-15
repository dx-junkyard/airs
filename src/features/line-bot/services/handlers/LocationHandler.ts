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
  ACTION_SELECT_LANDMARK,
  ACTION_SKIP_LANDMARK,
} from '@/features/line-bot/constants/postbackActions';
import {
  buildLocationMessage,
  buildNearbyLandmarksMessage,
  buildActionCategoryMessages,
  textMessage,
} from '@/features/line-bot/services/LineMessageBuilder';
import DIContainer from '@/server/infrastructure/di/container';
import ReverseGeocodeUseCase from '@/server/application/use-cases/geo/ReverseGeocodeUseCase';
import SearchNearbyLandmarksUseCase from '@/server/application/use-cases/geo/SearchNearbyLandmarksUseCase';
import { validateGeofence } from '@/features/line-bot/utils/geofenceValidator';
import type { IStepHandler } from '@/features/line-bot/services/handlers/IStepHandler';

/**
 * Step 5 + 5a: 位置入力・ランドマーク選択ハンドラー
 */
class LocationHandler implements IStepHandler {
  constructor(private sessionRepo: ILineSessionRepository) {}

  async handle(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages> {
    // ランドマーク選択のpostback処理
    if (event.type === 'postback' && event.postbackData) {
      const payload = parsePostbackData(event.postbackData);
      if (
        payload.action === ACTION_SELECT_LANDMARK ||
        payload.action === ACTION_SKIP_LANDMARK
      ) {
        return this.handleLandmarkSelection(session, payload);
      }
    }

    // 位置情報メッセージ
    if (event.type === 'message' && event.location) {
      const { latitude, longitude } = event.location;
      const replyMessages = await this.processLocation(
        session,
        latitude,
        longitude
      );
      return { replyMessages };
    }

    // テキストメッセージ（住所入力）は受け付けない
    if (event.type === 'message' && event.text) {
      return {
        replyMessages: [
          textMessage(
            '住所のテキスト入力は利用できません。位置情報を送信してください。'
          ),
          buildLocationMessage(),
        ],
      };
    }

    return {
      replyMessages: [buildLocationMessage()],
    };
  }

  /**
   * 位置情報を処理（住所取得 → ランドマーク検索）
   */
  private async processLocation(
    session: LineSessionData,
    latitude: number,
    longitude: number
  ): Promise<messagingApi.Message[]> {
    try {
      const geoRepository = DIContainer.getGeoRepository();

      let address: string;
      let normalizedAddress:
        | {
            prefecture: string;
            city: string;
            oaza: string;
            aza: string;
            detail: string;
            full: string;
            areaKey: string;
          }
        | undefined;
      try {
        const reverseGeocodeUseCase = new ReverseGeocodeUseCase(geoRepository);
        const geocode = await reverseGeocodeUseCase.execute(
          latitude,
          longitude
        );
        address = geocode.address;
        normalizedAddress = geocode.normalizedAddress;
      } catch {
        address = `${latitude}, ${longitude}`;
      }

      // ジオフェンシング検証
      const geofenceResult = await validateGeofence(address);
      if (!geofenceResult.isAllowed) {
        return [
          textMessage(
            `送信された位置情報の住所（${address}）が対象地域（${geofenceResult.prefix}）と一致しません。正しい位置情報を再送信してください。`
          ),
          buildLocationMessage(),
        ];
      }

      const newState: LineSessionState = {
        ...session.state,
        location: {
          latitude,
          longitude,
          address,
          normalizedAddress,
        },
      };

      // 周辺ランドマーク検索
      try {
        const searchUseCase = new SearchNearbyLandmarksUseCase(geoRepository);
        const landmarks = await searchUseCase.execute(
          latitude,
          longitude,
          100
        );

        if (landmarks.length > 0) {
          const stateWithLandmarks: LineSessionState = {
            ...newState,
            nearbyLandmarks: landmarks,
          };
          await this.sessionRepo.save(
            session.lineUserId,
            'location',
            stateWithLandmarks
          );
          return [buildNearbyLandmarksMessage(landmarks)];
        }
      } catch (error) {
        console.error('Nearby landmarks search error:', error);
      }

      // ランドマークなし → 行動カテゴリ選択へ
      await this.sessionRepo.save(
        session.lineUserId,
        'action-category',
        newState
      );
      return buildActionCategoryMessages();
    } catch (error) {
      console.error('Location processing error:', error);
      const newState: LineSessionState = {
        ...session.state,
        location: {
          latitude,
          longitude,
          address: `${latitude}, ${longitude}`,
        },
      };
      await this.sessionRepo.save(
        session.lineUserId,
        'action-category',
        newState
      );
      return buildActionCategoryMessages();
    }
  }

  /**
   * ランドマーク選択のハンドリング
   */
  handleLandmarkSelection(
    session: LineSessionData,
    payload: { action: string; id?: string }
  ): Promise<LineResponseMessages> {
    return this.doHandleLandmarkSelection(session, payload);
  }

  private async doHandleLandmarkSelection(
    session: LineSessionData,
    payload: { action: string; id?: string }
  ): Promise<LineResponseMessages> {
    let landmarkName: string | undefined;

    if (
      payload.action === ACTION_SELECT_LANDMARK &&
      payload.id &&
      session.state.nearbyLandmarks
    ) {
      const landmark = session.state.nearbyLandmarks.find(
        (lm) => lm.id === payload.id
      );
      if (landmark) {
        landmarkName = landmark.name;
      }
    }

    const newState: LineSessionState = {
      ...session.state,
      location: {
        ...session.state.location!,
        landmarkName,
      },
    };
    await this.sessionRepo.save(
      session.lineUserId,
      'action-category',
      newState
    );
    return {
      replyMessages: buildActionCategoryMessages(),
    };
  }
}

export default LocationHandler;
