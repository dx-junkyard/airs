import type { IFacilityRepository } from '@/server/domain/repositories/IFacilityRepository';
import StaffId from '@/server/domain/models/StaffId';
import type { FacilityDto } from '@/server/application/dtos/FacilityDto';
import FacilityMapper from '@/server/infrastructure/mappers/FacilityMapper';

/**
 * GetFacilitiesByStaffUseCase
 *
 * 職員の周辺施設一覧を取得するユースケース
 */
class GetFacilitiesByStaffUseCase {
  constructor(private repository: IFacilityRepository) {}

  async execute(staffId: string): Promise<FacilityDto[]> {
    const id = StaffId.create(staffId);
    const facilities = await this.repository.findByStaffId(id);
    return facilities.map(FacilityMapper.toDto);
  }
}

export default GetFacilitiesByStaffUseCase;
