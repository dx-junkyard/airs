import type {
  Report as PrismaReport,
  Prisma,
  Staff as PrismaStaff,
  EventReport as PrismaEventReport,
  Event as PrismaEvent,
} from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import type { ReportImage } from '@/server/domain/value-objects/ImageUrls';
import type {
  IReportRepository,
  ReportFilterParams,
  ReportFilterResult,
} from '@/server/domain/repositories/IReportRepository';
import type { CreateReportDto } from '@/server/application/dtos/CreateReportDto';
import Report from '@/server/domain/models/Report';
import ReportId from '@/server/domain/models/ReportId';
import Address from '@/server/domain/value-objects/Address';
import AnimalType from '@/server/domain/value-objects/AnimalType';
import ImageUrls from '@/server/domain/value-objects/ImageUrls';
import Location from '@/server/domain/value-objects/Location';
import PhoneNumber from '@/server/domain/value-objects/PhoneNumber';
import ReportStatus from '@/server/domain/value-objects/ReportStatus';
import SortOrder from '@/server/domain/value-objects/SortOrder';
import { ANIMAL_TYPES } from '@/server/domain/constants/animalTypes';
import {
  getMapDefaultDataRangeStartDate,
  type MapDefaultDataRangeValue,
} from '@/server/domain/constants/mapDefaultDataRange';
import prisma from '@/server/infrastructure/database/prisma';
import { normalizeAddress } from '@/server/infrastructure/geo/normalizeAddress';

/**
 * 検索キーワードにマッチする獣種コードを返す
 * 日本語ラベルの部分一致で判定する
 * 例: "クマ" → ["bear"], "イノシシ" → ["wild_boar"]
 */
function findMatchingAnimalTypeCodes(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return Object.values(ANIMAL_TYPES)
    .filter((config) => config.label.includes(trimmed))
    .map((config) => config.id);
}

function compactAddressQuery(value: string): string {
  return value.replace(/[,\s\u3000]/g, '');
}

function toZenkaku(value: string): string {
  return Array.from(value)
    .map((char) => {
      if (char === ' ') return '　';
      const code = char.charCodeAt(0);
      if (code >= 0x21 && code <= 0x7e) {
        return String.fromCharCode(code + 0xfee0);
      }
      return char;
    })
    .join('');
}

function buildAddressQueryVariants(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const nfkc = trimmed.normalize('NFKC');
  const zenkaku = toZenkaku(nfkc);
  const variants = [
    trimmed,
    compactAddressQuery(trimmed),
    nfkc,
    compactAddressQuery(nfkc),
    zenkaku,
    compactAddressQuery(zenkaku),
  ];

  return Array.from(new Set(variants.filter((v) => v.length > 0)));
}

function buildAddressSearchConditions(query: string): Prisma.ReportWhereInput[] {
  const variants = buildAddressQueryVariants(query);

  return variants.flatMap((variant) => [
    { address: { contains: variant, mode: 'insensitive' } },
    {
      normalizedAddress: {
        path: ['full'],
        string_contains: variant,
      },
    },
  ]);
}

/**
 * PrismaReportRepository
 *
 * Prisma + PostgreSQL を使用したReportリポジトリ実装
 */
/** Staff・EventReport を含む Report 型 */
type PrismaReportWithRelations = PrismaReport & {
  staff?: PrismaStaff | null;
  eventReports?: Array<
    PrismaEventReport & {
      event: PrismaEvent & {
        _count: { eventReports: number };
      };
    }
  >;
};

class PrismaReportRepository implements IReportRepository {
  /**
   * Prisma Report → Domain Report変換
   */
  private toDomain(prismaReport: PrismaReportWithRelations): Report {
    // イベント情報を取得（1通報は最大1イベントに所属）
    const eventReport = prismaReport.eventReports?.[0];
    const eventId = eventReport?.eventId;
    const eventReportCount = eventReport?.event?._count?.eventReports;

    // normalizedAddressからエリア情報を取得
    const normalizedAddr = prismaReport.normalizedAddress as Record<string, string> | null;
    const areaKey = normalizedAddr?.areaKey || undefined;
    const areaRegionLabel = normalizedAddr
      ? [normalizedAddr.prefecture, normalizedAddr.city].filter(Boolean).join('') || undefined
      : undefined;
    const areaChomeLabel = normalizedAddr
      ? [normalizedAddr.oaza, normalizedAddr.aza].filter(Boolean).join('') || undefined
      : undefined;

    return Report.create({
      id: ReportId.create(prismaReport.id),
      animalType: AnimalType.create(prismaReport.animalType),
      location: Location.create(prismaReport.latitude, prismaReport.longitude),
      address: Address.create(prismaReport.address),
      phoneNumber: prismaReport.phoneNumber
        ? PhoneNumber.create(prismaReport.phoneNumber)
        : undefined,
      imageUrls: ImageUrls.create(
        (prismaReport.images as ReportImage[] | null) ?? []
      ),
      description: prismaReport.description ?? undefined,
      status: ReportStatus.create(prismaReport.status),
      staffId: prismaReport.staffId ?? undefined,
      staffName: prismaReport.staff?.name ?? undefined,
      areaKey,
      areaRegionLabel,
      areaChomeLabel,
      eventId,
      eventReportCount,
      hasOnlyDate: prismaReport.hasOnlyDate,
      createdAt: prismaReport.createdAt,
      updatedAt: prismaReport.updatedAt,
      deletedAt: prismaReport.deletedAt,
    });
  }

  async findAll(options?: {
    sortOrder?: SortOrder;
    startDate?: Date;
    endDate?: Date;
    mapDefaultDataRange?: MapDefaultDataRangeValue;
  }): Promise<Report[]> {
    const order = options?.sortOrder?.value ?? 'desc';
    const where: Prisma.ReportWhereInput = { deletedAt: null };
    const startDate = options?.startDate;
    const endDate = options?.endDate;
    const startDateFromDefaultRange =
      !startDate && !endDate && options?.mapDefaultDataRange
        ? getMapDefaultDataRangeStartDate(options.mapDefaultDataRange)
        : undefined;

    // 日付範囲フィルター
    if (startDate || endDate || startDateFromDefaultRange) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      } else if (startDateFromDefaultRange) {
        where.createdAt.gte = startDateFromDefaultRange;
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: order },
      include: { staff: true },
    });
    return reports.map((r) => this.toDomain(r));
  }

  async findAllIncludingDeleted(): Promise<Report[]> {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: { staff: true },
    });
    return reports.map((r) => this.toDomain(r));
  }

  async findById(id: ReportId): Promise<Report | undefined> {
    const report = await prisma.report.findFirst({
      where: { id: id.value, deletedAt: null },
      include: { staff: true },
    });
    return report ? this.toDomain(report) : undefined;
  }

  async create(dto: CreateReportDto): Promise<Report> {
    const normalizedAddress =
      dto.normalizedAddress ?? normalizeAddress(dto.address);
    const lat = parseFloat(dto.latitude);
    const lng = parseFloat(dto.longitude);
    const images = JSON.stringify(dto.images ?? []);
    const createdAt = dto.createdAt ? new Date(dto.createdAt) : new Date();

    const rows = await prisma.$queryRaw<PrismaReportWithRelations[]>`
      INSERT INTO reports (
        id, "animalType", latitude, longitude, location, address,
        "normalizedAddress", "phoneNumber", images, description,
        status, "hasOnlyDate", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${dto.animalType},
        ${lat},
        ${lng},
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        ${dto.address},
        ${JSON.stringify(normalizedAddress)}::jsonb,
        ${dto.phoneNumber ?? null},
        ${images}::jsonb,
        ${dto.description ?? null},
        'waiting',
        ${dto.hasOnlyDate ?? false},
        ${createdAt},
        ${createdAt}
      )
      RETURNING id, "animalType", latitude, longitude, address,
        "normalizedAddress", "phoneNumber", images, description,
        status, "hasOnlyDate", "staffId", "createdAt", "updatedAt", "deletedAt"
    `;
    return this.toDomain(rows[0]);
  }

  async createMany(
    dtos: CreateReportDto[]
  ): Promise<
    Array<{
      id: string;
      animalType: string;
      latitude: number;
      longitude: number;
      hasOnlyDate: boolean;
      createdAt: Date;
    }>
  > {
    if (dtos.length === 0) return [];

    const data = dtos.map((dto) => {
      const normalizedAddress =
        dto.normalizedAddress ?? normalizeAddress(dto.address);
      return {
        animalType: dto.animalType,
        latitude: parseFloat(dto.latitude),
        longitude: parseFloat(dto.longitude),
        address: dto.address,
        normalizedAddress: normalizedAddress as unknown as InputJsonValue,
        phoneNumber: dto.phoneNumber,
        images: (dto.images ?? []) as unknown as InputJsonValue,
        description: dto.description,
        status: 'waiting',
        hasOnlyDate: dto.hasOnlyDate ?? false,
        ...(dto.createdAt ? { createdAt: new Date(dto.createdAt) } : {}),
      };
    });

    const created = await prisma.report.createManyAndReturn({
      data,
      select: {
        id: true,
        animalType: true,
        latitude: true,
        longitude: true,
        hasOnlyDate: true,
        createdAt: true,
      },
    });

    return created;
  }

  async updateLocations(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    await prisma.$executeRawUnsafe(
      `
      UPDATE reports
      SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
      WHERE id = ANY($1::text[])
        AND location IS NULL
      `,
      ids
    );
  }

  async save(report: Report): Promise<Report> {
    const normalizedAddress = normalizeAddress(report.address.value);
    const lat = report.location.latitude;
    const lng = report.location.longitude;
    const images = JSON.stringify([...report.imageUrls.images]);

    const rows = await prisma.$queryRaw<PrismaReportWithRelations[]>`
      UPDATE reports SET
        "animalType" = ${report.animalType.value},
        latitude = ${lat},
        longitude = ${lng},
        location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        address = ${report.address.value},
        "normalizedAddress" = ${JSON.stringify(normalizedAddress)}::jsonb,
        "phoneNumber" = ${report.phoneNumber?.value ?? null},
        images = ${images}::jsonb,
        description = ${report.description ?? null},
        status = ${report.status.value},
        "staffId" = ${report.staffId ?? null},
        "updatedAt" = ${report.updatedAt},
        "deletedAt" = ${report.deletedAt ?? null}
      WHERE id = ${report.id.value}
      RETURNING id, "animalType", latitude, longitude, address,
        "normalizedAddress", "phoneNumber", images, description,
        status, "hasOnlyDate", "staffId", "createdAt", "updatedAt", "deletedAt"
    `;

    // staff リレーションを取得して返す
    if (rows[0].staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: rows[0].staffId },
      });
      rows[0].staff = staff;
    }
    return this.toDomain(rows[0]);
  }

  async softDelete(id: ReportId): Promise<boolean> {
    try {
      // 未削除のレポートのみ論理削除を実行
      const result = await prisma.report.updateMany({
        where: { id: id.value, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      // 更新件数が0の場合は既に削除済みまたは存在しない
      return result.count > 0;
    } catch {
      return false;
    }
  }

  async filterByStatus(status: ReportStatus): Promise<Report[]> {
    const reports = await prisma.report.findMany({
      where: {
        status: status.value,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: { staff: true },
    });
    return reports.map((r) => this.toDomain(r));
  }

  async filterByAnimalType(animalType: AnimalType): Promise<Report[]> {
    const reports = await prisma.report.findMany({
      where: {
        animalType: animalType.value,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: { staff: true },
    });
    return reports.map((r) => this.toDomain(r));
  }

  async search(query: string): Promise<Report[]> {
    const orConditions: Prisma.ReportWhereInput[] = [
      ...buildAddressSearchConditions(query),
      { description: { contains: query, mode: 'insensitive' } },
      { animalType: { contains: query, mode: 'insensitive' } },
    ];

    // 検索キーワードが獣種名（日本語ラベル）にマッチする場合、
    // 該当する獣種コードでの検索条件を追加
    const matchingAnimalTypes = findMatchingAnimalTypeCodes(query);
    if (matchingAnimalTypes.length > 0) {
      orConditions.push({ animalType: { in: matchingAnimalTypes } });
    }

    const reports = await prisma.report.findMany({
      where: {
        deletedAt: null,
        OR: orConditions,
      },
      orderBy: { createdAt: 'desc' },
      include: { staff: true },
    });
    return reports.map((r) => this.toDomain(r));
  }

  async countByArea(options?: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<
    Array<{
      areaKey: string;
      regionLabel: string;
      chomeLabel: string;
      count: number;
    }>
  > {
    const limit = options?.limit ?? 10;

    // 日付条件のパラメータを構築
    const startDate = options?.startDate ?? null;
    let endDate: Date | null = null;
    if (options?.endDate) {
      endDate = new Date(options.endDate);
      endDate.setHours(23, 59, 59, 999);
    }

    // normalizedAddress の構造化値をそのまま連結して集計する
    const result = await prisma.$queryRaw<
      Array<{
        area_key: string;
        region_label: string;
        chome_label: string;
        count: bigint;
      }>
    >`
      SELECT
        CONCAT_WS(
          '',
          NULLIF("normalizedAddress"->>'prefecture', ''),
          NULLIF("normalizedAddress"->>'city', ''),
          NULLIF("normalizedAddress"->>'oaza', ''),
          NULLIF("normalizedAddress"->>'aza', '')
        ) AS area_key,
        CONCAT_WS(
          '',
          NULLIF("normalizedAddress"->>'prefecture', ''),
          NULLIF("normalizedAddress"->>'city', '')
        ) AS region_label,
        CONCAT_WS(
          '',
          NULLIF("normalizedAddress"->>'oaza', ''),
          NULLIF("normalizedAddress"->>'aza', '')
        ) AS chome_label,
        COUNT(*) AS count
      FROM reports
      WHERE "deletedAt" IS NULL
        AND (${startDate}::timestamptz IS NULL OR "createdAt" >= ${startDate}::timestamptz)
        AND (${endDate}::timestamptz IS NULL OR "createdAt" <= ${endDate}::timestamptz)
        AND "normalizedAddress" IS NOT NULL
        AND CONCAT_WS(
          '',
          NULLIF("normalizedAddress"->>'prefecture', ''),
          NULLIF("normalizedAddress"->>'city', ''),
          NULLIF("normalizedAddress"->>'oaza', ''),
          NULLIF("normalizedAddress"->>'aza', '')
        ) <> ''
      GROUP BY area_key, region_label, chome_label
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    return result.map((row) => ({
      areaKey: row.area_key,
      regionLabel: row.region_label,
      chomeLabel: row.chome_label,
      count: Number(row.count),
    }));
  }

  async findWithFilters(
    params: ReportFilterParams
  ): Promise<ReportFilterResult> {
    const {
      query,
      status,
      animalType,
      staffId,
      startDate,
      endDate,
      sortOrder,
      page,
      limit,
    } = params;

    // WHERE条件を構築
    const where: Prisma.ReportWhereInput = {
      deletedAt: null,
    };

    // 検索クエリ
    if (query && query.trim()) {
      const orConditions: Prisma.ReportWhereInput[] = [
        ...buildAddressSearchConditions(query),
        { description: { contains: query, mode: 'insensitive' } },
      ];

      // 検索キーワードが獣種名（日本語ラベル）にマッチする場合、
      // 該当する獣種コードでの検索条件を追加
      const matchingAnimalTypes = findMatchingAnimalTypeCodes(query);
      if (matchingAnimalTypes.length > 0) {
        orConditions.push({ animalType: { in: matchingAnimalTypes } });
      }

      where.OR = orConditions;
    }

    // ステータスフィルター
    if (params.statuses && params.statuses.length > 0) {
      where.status = { in: params.statuses.map((s) => s.value) };
    } else if (status) {
      where.status = status.value;
    }

    // 獣種フィルター
    if (animalType) {
      where.animalType = animalType.value;
    }

    // 担当者フィルター
    if (staffId) {
      where.staffId = staffId;
    }

    // 日付範囲フィルター
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        // 終了日は23:59:59までを含める
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    // ソート順
    const order = sortOrder?.value ?? 'desc';

    // 総件数を取得
    const totalCount = await prisma.report.count({ where });

    // ページネーション計算
    const skip = (page - 1) * limit;

    // データ取得
    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: order },
      skip,
      take: limit,
      include: {
        staff: true,
        eventReports: {
          where: { deletedAt: null },
          include: {
            event: {
              include: {
                _count: {
                  select: { eventReports: true },
                },
              },
            },
          },
        },
      },
    });

    return {
      reports: reports.map((r) => this.toDomain(r)),
      totalCount,
    };
  }
}

export default PrismaReportRepository;
