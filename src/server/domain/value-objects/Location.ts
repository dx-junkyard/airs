/**
 * Location値オブジェクト
 *
 * 緯度・経度のバリデーションロジックを内包し、
 * 不正な座標値の生成を防ぐ。
 */
class Location {
  private constructor(
    private readonly _latitude: number,
    private readonly _longitude: number
  ) {}

  /**
   * 緯度・経度からLocation値オブジェクトを生成
   * @param latitude 緯度（-90〜90）
   * @param longitude 経度（-180〜180）
   * @returns Location値オブジェクト
   * @throws {Error} 不正な座標値の場合
   */
  static create(latitude: number, longitude: number): Location {
    if (typeof latitude !== 'number' || isNaN(latitude)) {
      throw new Error('緯度は数値で指定してください');
    }

    if (typeof longitude !== 'number' || isNaN(longitude)) {
      throw new Error('経度は数値で指定してください');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('緯度は-90から90の範囲で指定してください');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('経度は-180から180の範囲で指定してください');
    }

    return new Location(latitude, longitude);
  }

  /**
   * 緯度を取得
   */
  get latitude(): number {
    return this._latitude;
  }

  /**
   * 経度を取得
   */
  get longitude(): number {
    return this._longitude;
  }

  /**
   * 等価性の判定
   */
  equals(other: Location): boolean {
    return (
      this._latitude === other._latitude && this._longitude === other._longitude
    );
  }

  /**
   * 2点間の距離を計算（Haversine公式）
   *
   * @param other 比較対象のLocation
   * @returns 距離（メートル）
   */
  distanceTo(other: Location): number {
    const R = 6371000; // 地球の半径（メートル）
    const dLat = ((other._latitude - this._latitude) * Math.PI) / 180;
    const dLon = ((other._longitude - this._longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((this._latitude * Math.PI) / 180) *
        Math.cos((other._latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return `${this._latitude},${this._longitude}`;
  }
}

export default Location;
