import type { IStaffRepository } from '@/server/domain/repositories/IStaffRepository';
import type { CreateStaffDto } from '@/server/application/dtos/CreateStaffDto';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import StaffMapper from '@/server/infrastructure/mappers/StaffMapper';

/**
 * CreateStaffUseCase
 *
 * 新規職員作成のユースケース
 */
class CreateStaffUseCase {
  constructor(private repository: IStaffRepository) {}

  async execute(dto: CreateStaffDto): Promise<StaffDto> {
    // Repository側でDTOからStaffを作成し、IDを自動発行
    const savedStaff = await this.repository.create(dto);

    // DTOに変換して返却
    return StaffMapper.toDto(savedStaff);
  }
}

export default CreateStaffUseCase;
