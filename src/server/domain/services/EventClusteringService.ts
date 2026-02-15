import type {
  ClusteringConfig,
  IEventClusteringRepository,
} from '@/server/domain/repositories/IEventClusteringRepository';

/**
 * クラスタリング結果の種別
 */
export type ClusteringResultType =
  | 'added_to_event' // 既存イベントに追加
  | 'created_event' // 新規イベント作成
  | 'pending'; // 待機状態（マッチなし）

/**
 * クラスタリング処理結果
 */
export interface ClusteringResult {
  type: ClusteringResultType;
  eventId?: string; // added_to_event または created_event の場合
  matchedReportId?: string; // created_event の場合、マッチした待機中通報ID
}

/**
 * EventClusteringService
 *
 * 通報のイベントクラスタリングを担当するドメインサービス
 *
 * クラスタリングルール:
 * 1. 既存イベントに追加: 新通報が既存イベントに近接（距離閾値以内 & 時間閾値以内 & 同じ獣種）していれば追加
 * 2. 新規イベント作成: 待機中の通報に近接していれば、両方で新規イベントを作成
 * 3. 待機状態: どちらにもマッチしなければ待機（単独通報はイベントにならない）
 */
class EventClusteringService {
  constructor(
    private repository: IEventClusteringRepository,
    private config: ClusteringConfig
  ) {}

  /**
   * 新規通報のクラスタリング処理
   *
   * @param reportId 新規通報ID
   * @param animalType 獣種
   * @param createdAt 通報作成日時
   * @returns クラスタリング結果
   */
  async processNewReport(
    reportId: string,
    animalType: string,
    createdAt: Date
  ): Promise<ClusteringResult> {
    // 1. 既存イベントにマッチするか確認
    const matchingEventId = await this.repository.findMatchingEvent(
      reportId,
      animalType,
      createdAt,
      this.config
    );

    if (matchingEventId) {
      await this.repository.addReportToEvent(matchingEventId, reportId);
      return {
        type: 'added_to_event',
        eventId: matchingEventId,
      };
    }

    // 2. 待機中通報にマッチするか確認
    const pendingReportIds = await this.repository.getPendingReportIds(
      createdAt,
      this.config
    );

    const matchingPendingId = await this.repository.findMatchingPendingReport(
      reportId,
      animalType,
      createdAt,
      pendingReportIds,
      this.config
    );

    if (matchingPendingId) {
      // マッチした待機中通報と新規イベントを作成
      const newEventId = await this.repository.createEventWithReports(
        matchingPendingId,
        reportId
      );
      return {
        type: 'created_event',
        eventId: newEventId,
        matchedReportId: matchingPendingId,
      };
    }

    // 3. マッチなし → 待機状態
    return {
      type: 'pending',
    };
  }
}

export default EventClusteringService;
