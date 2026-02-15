import type { IStaffRepository } from '@/server/domain/repositories/IStaffRepository';
import StaffId from '@/server/domain/models/StaffId';

/**
 * DeleteStaffUseCase
 *
 * 職員削除（論理削除）のユースケース
 */
class DeleteStaffUseCase {
  constructor(private repository: IStaffRepository) {}

  async execute(id: string): Promise<boolean> {
    const staffId = StaffId.create(id);
    return await this.repository.softDelete(staffId);
  }
}

export default DeleteStaffUseCase;
