import Facility from '@/server/domain/models/Facility';
import type { FacilityDto } from '@/server/application/dtos/FacilityDto';

/**
 * FacilityMapper
 *
 * Facilityエンティティ ↔ DTO変換
 */
class FacilityMapper {
  /**
   * Facilityエンティティ → FacilityDto
   */
  static toDto(facility: Facility): FacilityDto {
    return {
      id: facility.id.value,
      staffId: facility.staffId.value,
      overpassId: facility.overpassId ?? '',
      name: facility.name,
      category: facility.category,
      latitude: facility.location.latitude,
      longitude: facility.location.longitude,
      isShared: facility.isShared,
      createdAt: facility.createdAt.toISOString(),
    };
  }
}

export default FacilityMapper;
