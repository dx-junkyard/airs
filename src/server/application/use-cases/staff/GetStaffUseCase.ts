import type { IStaffRepository } from '@/server/domain/repositories/IStaffRepository';
import StaffId from '@/server/domain/models/StaffId';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import StaffMapper from '@/server/infrastructure/mappers/StaffMapper';

/**
 * GetStaffUseCase
 *
 * 職員取得のユースケース
 */
class GetStaffUseCase {
  constructor(private repository: IStaffRepository) {}

  async execute(id: string): Promise<StaffDto | undefined> {
    const staffId = StaffId.create(id);
    const staff = await this.repository.findById(staffId);

    if (!staff) {
      return undefined;
    }

    return StaffMapper.toDto(staff);
  }
}

export default GetStaffUseCase;
