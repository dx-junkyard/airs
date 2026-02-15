import type { IStaffRepository } from '@/server/domain/repositories/IStaffRepository';
import StaffId from '@/server/domain/models/StaffId';
import type { UpdateStaffDto } from '@/server/application/dtos/UpdateStaffDto';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import StaffMapper from '@/server/infrastructure/mappers/StaffMapper';

/**
 * UpdateStaffUseCase
 *
 * 職員更新のユースケース
 */
class UpdateStaffUseCase {
  constructor(private repository: IStaffRepository) {}

  async execute(id: string, dto: UpdateStaffDto): Promise<StaffDto> {
    const staffId = StaffId.create(id);
    const staff = await this.repository.findById(staffId);

    if (!staff) {
      throw new Error('職員が見つかりません');
    }

    // フィールドを更新
    const updateParams = StaffMapper.toUpdateParams(dto);
    staff.update(updateParams);

    // 保存
    const updatedStaff = await this.repository.save(staff);

    return StaffMapper.toDto(updatedStaff);
  }
}

export default UpdateStaffUseCase;
