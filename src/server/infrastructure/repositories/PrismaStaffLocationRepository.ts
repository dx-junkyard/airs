import type { StaffLocation as PrismaStaffLocation } from '@prisma/client';
import type { IStaffLocationRepository } from '@/server/domain/repositories/IStaffLocationRepository';
import StaffLocation from '@/server/domain/models/StaffLocation';
import StaffLocationId from '@/server/domain/models/StaffLocationId';
import StaffId from '@/server/domain/models/StaffId';
import Location from '@/server/domain/value-objects/Location';
import prisma from '@/server/infrastructure/database/prisma';

/**
 * PrismaStaffLocationRepository
 *
 * Prisma + PostgreSQL を使用したStaffLocationリポジトリ実装
 */
class PrismaStaffLocationRepository implements IStaffLocationRepository {
  /**
   * Prisma StaffLocation → Domain StaffLocation変換
   */
  private toDomain(record: PrismaStaffLocation): StaffLocation {
    return StaffLocation.create({
      id: StaffLocationId.create(record.id),
      staffId: StaffId.create(record.staffId),
      location: Location.create(record.latitude, record.longitude),
      label: record.label,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    });
  }

  async findByStaffId(staffId: StaffId): Promise<StaffLocation[]> {
    const records = await prisma.staffLocation.findMany({
      where: { staffId: staffId.value, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findAll(): Promise<StaffLocation[]> {
    const records = await prisma.staffLocation.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findById(id: StaffLocationId): Promise<StaffLocation | undefined> {
    const record = await prisma.staffLocation.findUnique({
      where: { id: id.value },
    });
    return record ? this.toDomain(record) : undefined;
  }

  async create(
    staffId: StaffId,
    latitude: number,
    longitude: number,
    label: string | null
  ): Promise<StaffLocation> {
    const record = await prisma.$queryRaw<PrismaStaffLocation[]>`
      INSERT INTO staff_locations (id, "staffId", latitude, longitude, location, label, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        ${staffId.value},
        ${latitude},
        ${longitude},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
        ${label},
        NOW(),
        NOW()
      )
      RETURNING id, "staffId", latitude, longitude, label, "createdAt", "updatedAt", "deletedAt"
    `;
    return this.toDomain(record[0]);
  }

  async save(staffLocation: StaffLocation): Promise<StaffLocation> {
    const lat = staffLocation.location.latitude;
    const lng = staffLocation.location.longitude;

    const record = await prisma.$queryRaw<PrismaStaffLocation[]>`
      UPDATE staff_locations
      SET
        latitude = ${lat},
        longitude = ${lng},
        location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        label = ${staffLocation.label},
        "updatedAt" = NOW(),
        "deletedAt" = ${staffLocation.deletedAt}
      WHERE id = ${staffLocation.id.value}
      RETURNING id, "staffId", latitude, longitude, label, "createdAt", "updatedAt", "deletedAt"
    `;
    return this.toDomain(record[0]);
  }

  async softDelete(id: StaffLocationId): Promise<boolean> {
    try {
      await prisma.staffLocation.update({
        where: { id: id.value },
        data: { deletedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }
}

export default PrismaStaffLocationRepository;
