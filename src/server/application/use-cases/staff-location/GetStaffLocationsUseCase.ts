import type { IStaffLocationRepository } from '@/server/domain/repositories/IStaffLocationRepository';
import StaffId from '@/server/domain/models/StaffId';
import type { StaffLocationDto } from '@/server/application/dtos/StaffLocationDto';
import StaffLocationMapper from '@/server/infrastructure/mappers/StaffLocationMapper';

/**
 * GetStaffLocationsUseCase
 *
 * 職員の担当地域ピン一覧を取得するユースケース
 */
class GetStaffLocationsUseCase {
  constructor(private repository: IStaffLocationRepository) {}

  async execute(staffId: string): Promise<StaffLocationDto[]> {
    const id = StaffId.create(staffId);
    const locations = await this.repository.findByStaffId(id);
    return locations.map(StaffLocationMapper.toDto);
  }
}

export default GetStaffLocationsUseCase;
