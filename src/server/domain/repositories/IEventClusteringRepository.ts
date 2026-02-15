/**
 * クラスタリング設定
 */
export interface ClusteringConfig {
  /** 距離閾値（メートル） */
  distanceMeters: number;
  /** 時間閾値（分） */
  timeMinutes: number;
}

/**
 * IEventClusteringRepository
 *
 * イベントクラスタリング処理のためのリポジトリインターフェース
 * PostGISを使用した空間クエリを抽象化
 */
export interface IEventClusteringRepository {
  /**
   * 指定した通報に近接する既存イベントを検索
   *
   * @param reportId 対象通報ID
   * @param animalType 獣種
   * @param createdAt 通報作成日時
   * @param config クラスタリング設定
   * @returns マッチするイベントID、なければnull
   */
  findMatchingEvent(
    reportId: string,
    animalType: string,
    createdAt: Date,
    config: ClusteringConfig
  ): Promise<string | null>;

  /**
   * 指定した通報に近接する待機中（イベント未所属）通報を検索
   *
   * @param reportId 対象通報ID
   * @param animalType 獣種
   * @param createdAt 通報作成日時
   * @param pendingReportIds 待機中通報IDリスト
   * @param config クラスタリング設定
   * @returns マッチする待機中通報ID、なければnull
   */
  findMatchingPendingReport(
    reportId: string,
    animalType: string,
    createdAt: Date,
    pendingReportIds: string[],
    config: ClusteringConfig
  ): Promise<string | null>;

  /**
   * 通報が指定座標から距離閾値以内にあるかPostGISで判定
   *
   * @param reportId 対象通報ID
   * @param longitude 比較対象の経度
   * @param latitude 比較対象の緯度
   * @param distanceMeters 距離閾値（メートル）
   * @returns 距離閾値以内ならtrue
   */
  isWithinDistance(
    reportId: string,
    longitude: number,
    latitude: number,
    distanceMeters: number
  ): Promise<boolean>;

  /**
   * 2つの通報から新規イベントを作成
   *
   * @param reportId1 1つ目の通報ID
   * @param reportId2 2つ目の通報ID
   * @returns 作成されたイベントID
   */
  createEventWithReports(reportId1: string, reportId2: string): Promise<string>;

  /**
   * 既存イベントに通報を追加
   *
   * @param eventId イベントID
   * @param reportId 追加する通報ID
   */
  addReportToEvent(eventId: string, reportId: string): Promise<void>;

  /**
   * 待機中（イベント未所属かつ時間閾値内）の通報IDリストを取得
   *
   * @param beforeDate この日時より前に作成された通報は除外
   * @param config クラスタリング設定
   * @returns 待機中通報IDリスト
   */
  getPendingReportIds(
    beforeDate: Date,
    config: ClusteringConfig
  ): Promise<string[]>;

  /**
   * 通報IDからイベントIDを取得
   *
   * @param reportId 通報ID
   * @returns イベントID、所属イベントがなければnull
   */
  findEventIdByReportId(reportId: string): Promise<string | null>;

  /**
   * イベントの担当職員IDを更新
   *
   * @param eventId イベントID
   * @param staffId 担当職員ID（nullの場合は担当解除）
   */
  updateEventStaffId(eventId: string, staffId: string | null): Promise<void>;
}
