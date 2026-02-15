import type NearbyLandmark from '@/server/domain/value-objects/NearbyLandmark';
import type { NearbyLandmarkDto } from '@/server/application/dtos/NearbyLandmarkDto';
import {
  mapOverpassCategoryToKey,
  getFacilityCategoryEmoji,
} from '@/server/domain/constants/facilityCategories';

/**
 * Geoデータ変換マッパー
 *
 * ドメインモデル ↔ DTO の変換を行う
 */
class GeoMapper {
  /**
   * NearbyLandmarkドメインモデルをDTOに変換
   */
  static toNearbyLandmarkDto(landmark: NearbyLandmark): NearbyLandmarkDto {
    const categoryKey = mapOverpassCategoryToKey(landmark.category);
    return {
      id: landmark.id,
      name: landmark.name,
      category: landmark.category,
      categoryKey,
      emoji: getFacilityCategoryEmoji(categoryKey),
      distance: landmark.distanceMeters,
      latitude: landmark.location.latitude,
      longitude: landmark.location.longitude,
    };
  }
}

export default GeoMapper;
