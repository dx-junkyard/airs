import Staff from '@/server/domain/models/Staff';
import StaffEmail from '@/server/domain/value-objects/StaffEmail';
import StaffName from '@/server/domain/value-objects/StaffName';
import type {
  StaffDto,
  StaffReportCounts,
} from '@/server/application/dtos/StaffDto';
import type { UpdateStaffDto } from '@/server/application/dtos/UpdateStaffDto';
import type { UpdateStaffParams } from '@/server/domain/models/Staff';

/**
 * StaffMapper
 *
 * Staffエンティティ ↔ DTO変換
 */
class StaffMapper {
  /**
   * Staffエンティティ → StaffDto
   */
  static toDto(staff: Staff, reportCounts?: StaffReportCounts): StaffDto {
    return {
      id: staff.id.value,
      name: staff.name.value,
      email: staff.email?.value ?? null,
      ...(reportCounts && { reportCounts }),
      createdAt: staff.createdAt.toISOString(),
      updatedAt: staff.updatedAt.toISOString(),
      deletedAt: staff.deletedAt?.toISOString() ?? null,
    };
  }

  /**
   * UpdateStaffDto → Staff更新パラメータ
   */
  static toUpdateParams(dto: UpdateStaffDto): UpdateStaffParams {
    return {
      name: dto.name ? StaffName.create(dto.name) : undefined,
      email:
        dto.email === null
          ? null
          : dto.email
            ? StaffEmail.create(dto.email)
            : undefined,
    };
  }
}

export default StaffMapper;
