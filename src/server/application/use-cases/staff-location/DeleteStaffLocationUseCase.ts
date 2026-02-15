import type { IStaffLocationRepository } from '@/server/domain/repositories/IStaffLocationRepository';
import StaffLocationId from '@/server/domain/models/StaffLocationId';

/**
 * DeleteStaffLocationUseCase
 *
 * 担当地域ピンを削除するユースケース
 */
class DeleteStaffLocationUseCase {
  constructor(private repository: IStaffLocationRepository) {}

  async execute(id: string): Promise<boolean> {
    const locationId = StaffLocationId.create(id);
    return await this.repository.softDelete(locationId);
  }
}

export default DeleteStaffLocationUseCase;
