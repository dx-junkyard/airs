import type { IFacilityRepository } from '@/server/domain/repositories/IFacilityRepository';
import StaffId from '@/server/domain/models/StaffId';
import type { CreateFacilityDto } from '@/server/application/dtos/CreateFacilityDto';
import type { FacilityDto } from '@/server/application/dtos/FacilityDto';
import FacilityMapper from '@/server/infrastructure/mappers/FacilityMapper';

/**
 * RegisterFacilityUseCase
 *
 * 周辺施設を登録するユースケース。
 * 同じ職員 + overpassId の組み合わせが既に存在する場合はエラーをスローする。
 */
class RegisterFacilityUseCase {
  constructor(private repository: IFacilityRepository) {}

  async execute(dto: CreateFacilityDto): Promise<FacilityDto> {
    const staffId = StaffId.create(dto.staffId);

    // Overpass API経由の場合のみ重複チェック（手動登録はスキップ）
    if (dto.overpassId) {
      const existing = await this.repository.findByStaffIdAndOverpassId(
        staffId,
        dto.overpassId
      );
      if (existing) {
        throw new Error('この施設は既に登録されています');
      }
    }

    const facility = await this.repository.create(
      staffId,
      dto.overpassId ?? null,
      dto.name,
      dto.category,
      dto.latitude,
      dto.longitude
    );
    return FacilityMapper.toDto(facility);
  }
}

export default RegisterFacilityUseCase;
