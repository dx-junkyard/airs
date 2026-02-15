import type { IFacilityRepository } from '@/server/domain/repositories/IFacilityRepository';
import FacilityId from '@/server/domain/models/FacilityId';
import type { FacilityDto } from '@/server/application/dtos/FacilityDto';
import FacilityMapper from '@/server/infrastructure/mappers/FacilityMapper';

/**
 * ToggleFacilitySharedUseCase
 *
 * 施設の全体共有フラグを切り替えるユースケース
 */
class ToggleFacilitySharedUseCase {
  constructor(private repository: IFacilityRepository) {}

  async execute(id: string, isShared: boolean): Promise<FacilityDto> {
    const facilityId = FacilityId.create(id);
    const facility = await this.repository.updateShared(facilityId, isShared);
    return FacilityMapper.toDto(facility);
  }
}

export default ToggleFacilitySharedUseCase;
