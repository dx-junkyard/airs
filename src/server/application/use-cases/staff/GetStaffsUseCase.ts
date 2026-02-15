import type { IStaffRepository } from '@/server/domain/repositories/IStaffRepository';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import SortOrder from '@/server/domain/value-objects/SortOrder';
import StaffMapper from '@/server/infrastructure/mappers/StaffMapper';

/**
 * GetStaffsUseCase
 *
 * すべての職員取得のユースケース
 */
class GetStaffsUseCase {
  constructor(private repository: IStaffRepository) {}

  /**
   * 職員一覧を取得（担当通報件数付き）
   * @param sortOrder ソート順（'asc' | 'desc'）省略時は降順
   */
  async execute(sortOrder?: string): Promise<StaffDto[]> {
    const sort = sortOrder ? SortOrder.create(sortOrder) : SortOrder.DESC;
    const staffs = await this.repository.findAll(sort);

    // 全職員IDを取得して担当通報件数を一括取得
    const staffIds = staffs.map((s) => s.id.value);
    const reportCountsMap =
      await this.repository.getReportCountsByStaffIds(staffIds);

    return staffs.map((staff) =>
      StaffMapper.toDto(staff, reportCountsMap.get(staff.id.value))
    );
  }
}

export default GetStaffsUseCase;
