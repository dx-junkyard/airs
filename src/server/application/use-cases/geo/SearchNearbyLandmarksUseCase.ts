import type { IGeoRepository } from '@/server/domain/repositories/IGeoRepository';
import type { NearbyLandmarkDto } from '@/server/application/dtos/NearbyLandmarkDto';
import Location from '@/server/domain/value-objects/Location';
import GeoMapper from '@/server/infrastructure/mappers/GeoMapper';

/**
 * 周辺ランドマーク検索ユースケース
 *
 * 緯度経度から周辺の施設・ランドマークを検索する
 */
class SearchNearbyLandmarksUseCase {
  constructor(private geoRepository: IGeoRepository) {}

  /**
   * 周辺ランドマークを検索
   *
   * @param latitude 緯度
   * @param longitude 経度
   * @param radiusMeters 検索半径（メートル、デフォルト100）
   * @returns 周辺ランドマークのリスト
   */
  async execute(
    latitude: number,
    longitude: number,
    radiusMeters: number = 100
  ): Promise<NearbyLandmarkDto[]> {
    const location = Location.create(latitude, longitude);
    const landmarks = await this.geoRepository.searchNearbyLandmarks(
      location,
      radiusMeters
    );
    return landmarks.map(GeoMapper.toNearbyLandmarkDto);
  }
}

export default SearchNearbyLandmarksUseCase;
