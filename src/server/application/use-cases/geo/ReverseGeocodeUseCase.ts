import type { IGeoRepository } from '@/server/domain/repositories/IGeoRepository';
import type { StructuredAddress } from '@/server/domain/models/geo/StructuredAddressModel';
import Location from '@/server/domain/value-objects/Location';

export interface ReverseGeocodeUseCaseResult {
  address: string;
  normalizedAddress: StructuredAddress;
}

/**
 * 逆ジオコーディングユースケース
 *
 * 緯度経度から住所文字列を取得する
 */
class ReverseGeocodeUseCase {
  constructor(private geoRepository: IGeoRepository) {}

  /**
   * 緯度経度から住所を取得
   *
   * @param latitude 緯度
   * @param longitude 経度
   * @returns 住所文字列および構造化住所
   * @throws {Error} 住所が取得できない場合
   */
  async execute(
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodeUseCaseResult> {
    const location = Location.create(latitude, longitude);
    const result = await this.geoRepository.reverseGeocode(location);
    return {
      address: result.address.value,
      normalizedAddress: result.normalizedAddress.value,
    };
  }
}

export default ReverseGeocodeUseCase;
