import type { IFacilityRepository } from '@/server/domain/repositories/IFacilityRepository';
import type { FacilityDto } from '@/server/application/dtos/FacilityDto';
import FacilityMapper from '@/server/infrastructure/mappers/FacilityMapper';

/**
 * GetAllFacilitiesUseCase
 *
 * 全施設一覧を取得するユースケース（削除済み除外）
 */
class GetAllFacilitiesUseCase {
  constructor(private repository: IFacilityRepository) {}

  async execute(): Promise<FacilityDto[]> {
    const facilities = await this.repository.findAll();
    return facilities.map(FacilityMapper.toDto);
  }
}

export default GetAllFacilitiesUseCase;
