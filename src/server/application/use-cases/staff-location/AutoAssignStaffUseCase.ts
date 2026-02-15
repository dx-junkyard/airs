import type { IStaffLocationRepository } from '@/server/domain/repositories/IStaffLocationRepository';
import StaffAutoAssignService from '@/server/domain/services/StaffAutoAssignService';
import Location from '@/server/domain/value-objects/Location';

/**
 * AutoAssignStaffUseCase
 *
 * 通報の位置情報に基づいて最も近い担当職員を自動アサインするユースケース
 */
class AutoAssignStaffUseCase {
  constructor(private staffLocationRepository: IStaffLocationRepository) {}

  /**
   * @param latitude 通報の緯度
   * @param longitude 通報の経度
   * @returns 最も近いピンを持つ職員のID。ピンがない場合はnull
   */
  async execute(latitude: number, longitude: number): Promise<string | null> {
    const reportLocation = Location.create(latitude, longitude);
    const service = new StaffAutoAssignService(this.staffLocationRepository);
    return await service.findNearestStaffId(reportLocation);
  }
}

export default AutoAssignStaffUseCase;
