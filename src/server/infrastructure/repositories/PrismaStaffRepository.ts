import type { Staff as PrismaStaff } from '@prisma/client';
import type { IStaffRepository } from '@/server/domain/repositories/IStaffRepository';
import type { CreateStaffDto } from '@/server/application/dtos/CreateStaffDto';
import type { StaffReportCounts } from '@/server/application/dtos/StaffDto';
import Staff from '@/server/domain/models/Staff';
import StaffId from '@/server/domain/models/StaffId';
import StaffEmail from '@/server/domain/value-objects/StaffEmail';
import StaffName from '@/server/domain/value-objects/StaffName';
import type SortOrder from '@/server/domain/value-objects/SortOrder';
import prisma from '@/server/infrastructure/database/prisma';

/**
 * PrismaStaffRepository
 *
 * Prisma + PostgreSQL を使用したStaffリポジトリ実装
 */
class PrismaStaffRepository implements IStaffRepository {
  /**
   * Prisma Staff → Domain Staff変換
   */
  private toDomain(prismaStaff: PrismaStaff): Staff {
    return Staff.create({
      id: StaffId.create(prismaStaff.id),
      name: StaffName.create(prismaStaff.name),
      email: prismaStaff.email
        ? StaffEmail.create(prismaStaff.email)
        : null,
      createdAt: prismaStaff.createdAt,
      updatedAt: prismaStaff.updatedAt,
      deletedAt: prismaStaff.deletedAt,
    });
  }

  async findAll(sortOrder?: SortOrder): Promise<Staff[]> {
    const order = sortOrder?.value ?? 'desc';
    const staffs = await prisma.staff.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: order },
    });
    return staffs.map((s) => this.toDomain(s));
  }

  async findById(id: StaffId): Promise<Staff | undefined> {
    const staff = await prisma.staff.findUnique({
      where: { id: id.value },
    });
    return staff ? this.toDomain(staff) : undefined;
  }

  async create(dto: CreateStaffDto): Promise<Staff> {
    const prismaStaff = await prisma.staff.create({
      data: {
        name: dto.name,
        email: dto.email ?? null,
      },
    });
    return this.toDomain(prismaStaff);
  }

  async save(staff: Staff): Promise<Staff> {
    const prismaStaff = await prisma.staff.update({
      where: { id: staff.id.value },
      data: {
        name: staff.name.value,
        email: staff.email?.value ?? null,
        updatedAt: staff.updatedAt,
        deletedAt: staff.deletedAt,
      },
    });
    return this.toDomain(prismaStaff);
  }

  async softDelete(id: StaffId): Promise<boolean> {
    try {
      await prisma.staff.update({
        where: { id: id.value },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 各職員の担当通報件数を取得（確認待ち）
   * @param staffIds 職員IDの配列
   * @returns 職員IDごとの通報件数マップ
   */
  async getReportCountsByStaffIds(
    staffIds: string[]
  ): Promise<Map<string, StaffReportCounts>> {
    const counts = await prisma.report.groupBy({
      by: ['staffId', 'status'],
      where: {
        staffId: { in: staffIds },
        deletedAt: null,
        status: { in: ['waiting'] },
      },
      _count: true,
    });

    const result = new Map<string, StaffReportCounts>();

    // 全職員IDを初期化
    for (const id of staffIds) {
      result.set(id, { waiting: 0 });
    }

    // 集計結果をマッピング
    for (const row of counts) {
      if (!row.staffId) continue;
      const existing = result.get(row.staffId) ?? {
        waiting: 0,
      };
      if (row.status === 'waiting') {
        existing.waiting = row._count;
      }
      result.set(row.staffId, existing);
    }

    return result;
  }
}

export default PrismaStaffRepository;
