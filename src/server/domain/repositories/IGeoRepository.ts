import type Location from '@/server/domain/value-objects/Location';
import type NearbyLandmark from '@/server/domain/value-objects/NearbyLandmark';
import type ReverseGeocodeResultModel from '@/server/domain/models/geo/ReverseGeocodeResultModel';

/**
 * Geoリポジトリのインターフェース
 *
 * 地理情報の取得を抽象化する。
 * 逆ジオコーディングおよび周辺施設検索を提供。
 */
export interface IGeoRepository {
  /**
   * 緯度経度から住所を取得（逆ジオコーディング）
   *
   * @param location 緯度経度
   * @returns 住所および構造化住所
   * @throws {Error} 住所が取得できない場合
   */
  reverseGeocode(location: Location): Promise<ReverseGeocodeResultModel>;

  /**
   * 緯度経度から周辺のランドマーク・施設を検索
   *
   * @param location 検索中心の緯度経度
   * @param radiusMeters 検索半径（メートル）
   * @returns 周辺ランドマークのリスト（距離順、最大5件）
   */
  searchNearbyLandmarks(
    location: Location,
    radiusMeters: number
  ): Promise<NearbyLandmark[]>;
}
