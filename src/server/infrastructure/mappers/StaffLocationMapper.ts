import StaffLocation from '@/server/domain/models/StaffLocation';
import type { StaffLocationDto } from '@/server/application/dtos/StaffLocationDto';

/**
 * StaffLocationMapper
 *
 * StaffLocationエンティティ ↔ DTO変換
 */
class StaffLocationMapper {
  /**
   * StaffLocationエンティティ → StaffLocationDto
   */
  static toDto(staffLocation: StaffLocation): StaffLocationDto {
    return {
      id: staffLocation.id.value,
      staffId: staffLocation.staffId.value,
      latitude: staffLocation.location.latitude,
      longitude: staffLocation.location.longitude,
      label: staffLocation.label,
      createdAt: staffLocation.createdAt.toISOString(),
      updatedAt: staffLocation.updatedAt.toISOString(),
    };
  }
}

export default StaffLocationMapper;
