import type { IFacilityRepository } from '@/server/domain/repositories/IFacilityRepository';
import type { FacilityDto } from '@/server/application/dtos/FacilityDto';
import FacilityMapper from '@/server/infrastructure/mappers/FacilityMapper';

/**
 * GetSharedFacilitiesUseCase
 *
 * 全体共有の施設一覧を取得するユースケース
 */
class GetSharedFacilitiesUseCase {
  constructor(private repository: IFacilityRepository) {}

  async execute(): Promise<FacilityDto[]> {
    const facilities = await this.repository.findShared();
    return facilities.map(FacilityMapper.toDto);
  }
}

export default GetSharedFacilitiesUseCase;
