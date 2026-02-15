import type { Facility as PrismaFacility } from '@prisma/client';
import type { IFacilityRepository } from '@/server/domain/repositories/IFacilityRepository';
import Facility from '@/server/domain/models/Facility';
import FacilityId from '@/server/domain/models/FacilityId';
import StaffId from '@/server/domain/models/StaffId';
import Location from '@/server/domain/value-objects/Location';
import prisma from '@/server/infrastructure/database/prisma';

/**
 * PrismaFacilityRepository
 *
 * Prisma + PostgreSQL を使用したFacilityリポジトリ実装
 */
class PrismaFacilityRepository implements IFacilityRepository {
  /**
   * Prisma Facility → Domain Facility変換
   */
  private toDomain(record: PrismaFacility): Facility {
    return Facility.create({
      id: FacilityId.create(record.id),
      staffId: StaffId.create(record.staffId),
      overpassId: record.overpassId,
      name: record.name,
      category: record.category,
      location: Location.create(record.latitude, record.longitude),
      isShared: record.isShared,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    });
  }

  async findByStaffId(staffId: StaffId): Promise<Facility[]> {
    const records = await prisma.facility.findMany({
      where: { staffId: staffId.value, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findByStaffIdAndOverpassId(
    staffId: StaffId,
    overpassId: string
  ): Promise<Facility | undefined> {
    const record = await prisma.facility.findFirst({
      where: { staffId: staffId.value, overpassId, deletedAt: null },
    });
    return record ? this.toDomain(record) : undefined;
  }

  async findAll(): Promise<Facility[]> {
    const records = await prisma.facility.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findShared(): Promise<Facility[]> {
    const records = await prisma.facility.findMany({
      where: { isShared: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async create(
    staffId: StaffId,
    overpassId: string | null,
    name: string,
    category: string,
    latitude: number,
    longitude: number
  ): Promise<Facility> {
    // 手動登録の場合はユニークIDを生成（DBカラムはnon-nullable）
    const resolvedOverpassId =
      overpassId ?? `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const record = await prisma.$queryRaw<PrismaFacility[]>`
      INSERT INTO facilities (id, "staffId", "overpassId", name, category, latitude, longitude, location, "isShared", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        ${staffId.value},
        ${resolvedOverpassId},
        ${name},
        ${category},
        ${latitude},
        ${longitude},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
        false,
        NOW(),
        NOW()
      )
      RETURNING id, "staffId", "overpassId", name, category, latitude, longitude, "isShared", "createdAt", "updatedAt", "deletedAt"
    `;
    return this.toDomain(record[0]);
  }

  async updateShared(id: FacilityId, isShared: boolean): Promise<Facility> {
    const record = await prisma.facility.update({
      where: { id: id.value },
      data: { isShared },
    });
    return this.toDomain(record);
  }

  async softDelete(id: FacilityId): Promise<boolean> {
    try {
      await prisma.facility.update({
        where: { id: id.value },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }
}

export default PrismaFacilityRepository;
