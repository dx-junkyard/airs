import Location from '@/server/domain/value-objects/Location';

/**
 * NearbyLandmark値オブジェクト
 *
 * 周辺ランドマーク（施設・POI）を表す。
 * 検索中心地点からの距離情報を含む。
 */
class NearbyLandmark {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _category: string,
    private readonly _distanceMeters: number,
    private readonly _location: Location
  ) {}

  /**
   * NearbyLandmark値オブジェクトを生成
   *
   * @param params 生成パラメータ
   * @returns NearbyLandmark値オブジェクト
   * @throws {Error} バリデーションエラーの場合
   */
  static create(params: {
    id: string;
    name: string;
    category: string;
    distanceMeters: number;
    location: Location;
  }): NearbyLandmark {
    if (!params.id || params.id.trim() === '') {
      throw new Error('ランドマークIDは必須です');
    }

    if (!params.name || params.name.trim() === '') {
      throw new Error('ランドマーク名は必須です');
    }

    if (params.distanceMeters < 0) {
      throw new Error('距離は0以上で指定してください');
    }

    return new NearbyLandmark(
      params.id,
      params.name.trim(),
      params.category,
      params.distanceMeters,
      params.location
    );
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get category(): string {
    return this._category;
  }

  get distanceMeters(): number {
    return this._distanceMeters;
  }

  get location(): Location {
    return this._location;
  }

  /**
   * 等価性の判定
   */
  equals(other: NearbyLandmark): boolean {
    return this._id === other._id;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return `${this._name}（${this._category}、${this._distanceMeters}m）`;
  }
}

export default NearbyLandmark;
