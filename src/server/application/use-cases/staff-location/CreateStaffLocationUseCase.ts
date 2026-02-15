import type { IStaffLocationRepository } from '@/server/domain/repositories/IStaffLocationRepository';
import StaffId from '@/server/domain/models/StaffId';
import type { CreateStaffLocationDto } from '@/server/application/dtos/CreateStaffLocationDto';
import type { StaffLocationDto } from '@/server/application/dtos/StaffLocationDto';
import StaffLocationMapper from '@/server/infrastructure/mappers/StaffLocationMapper';

/**
 * CreateStaffLocationUseCase
 *
 * 担当地域ピンを作成するユースケース
 */
class CreateStaffLocationUseCase {
  constructor(private repository: IStaffLocationRepository) {}

  async execute(dto: CreateStaffLocationDto): Promise<StaffLocationDto> {
    const staffId = StaffId.create(dto.staffId);
    const staffLocation = await this.repository.create(
      staffId,
      dto.latitude,
      dto.longitude,
      dto.label ?? null
    );
    return StaffLocationMapper.toDto(staffLocation);
  }
}

export default CreateStaffLocationUseCase;
