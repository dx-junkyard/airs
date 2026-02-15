import type { IStaffLocationRepository } from '@/server/domain/repositories/IStaffLocationRepository';
import Location from '@/server/domain/value-objects/Location';

/**
 * StaffAutoAssignService
 *
 * 通報の位置情報に基づいて、最も近い担当地域ピンを持つ職員を自動アサインする。
 */
class StaffAutoAssignService {
  constructor(private staffLocationRepository: IStaffLocationRepository) {}

  /**
   * 通報の位置情報から最も近い担当職員のIDを返す
   *
   * @param reportLocation 通報の位置情報
   * @returns 最も近いピンを持つ職員のID。ピンが1件もない場合はnull
   */
  async findNearestStaffId(reportLocation: Location): Promise<string | null> {
    const allLocations = await this.staffLocationRepository.findAll();

    if (allLocations.length === 0) {
      return null;
    }

    let nearestStaffId: string | null = null;
    let minDistance = Infinity;

    for (const staffLocation of allLocations) {
      const distance = reportLocation.distanceTo(staffLocation.location);
      if (distance < minDistance) {
        minDistance = distance;
        nearestStaffId = staffLocation.staffId.value;
      }
    }

    return nearestStaffId;
  }
}

export default StaffAutoAssignService;
