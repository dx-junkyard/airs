'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/server/infrastructure/database/prisma';
import { requireAdmin } from '@/features/common/utils/isAdmin';
import type { EventDto, SearchEventsResult } from '@/server/application/dtos/EventDto';
import type { RecentEventSummaryDto } from '@/server/application/dtos/ReportStatisticsDto';

/**
 * 検索パラメータ
 */
export interface SearchEventsParams {
  animalType?: string;
  staffId?: string;
  sortOrder?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

/**
 * Event一覧を取得（ページネーション付き）
 */
export async function searchEventsWithPagination(
  params: SearchEventsParams
): Promise<SearchEventsResult> {
  const { animalType, staffId, sortOrder = 'desc', startDate, endDate, page, limit } = params;

  // WHERE条件を構築
  const whereConditions: string[] = ['e."deletedAt" IS NULL'];

  if (animalType && animalType !== 'all') {
    whereConditions.push(`r."animalType" = '${animalType}'`);
  }

  if (staffId && staffId !== 'all') {
    whereConditions.push(`e."staffId" = '${staffId}'`);
  }

  if (startDate) {
    whereConditions.push(`e."createdAt" >= '${startDate}T00:00:00.000Z'`);
  }

  if (endDate) {
    whereConditions.push(`e."createdAt" <= '${endDate}T23:59:59.999Z'`);
  }

  const whereClause = whereConditions.join(' AND ');

  // 総件数を取得
  const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
    SELECT COUNT(DISTINCT e.id) as count
    FROM events e
    LEFT JOIN reports r ON r.id = e."representativeReportId"
    WHERE ${whereClause}
  `);

  const totalCount = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;

  // Event一覧を取得
  type EventQueryResult = {
    id: string;
    centerLatitude: number;
    centerLongitude: number;
    representativeReportId: string | null;
    staffId: string | null;
    staffName: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    reportCount: bigint;
    animalType: string | null;
    address: string | null;
  };
  const events = await prisma.$queryRawUnsafe<EventQueryResult[]>(`
    SELECT
      e.id,
      e."centerLatitude",
      e."centerLongitude",
      e."representativeReportId",
      e."staffId",
      s.name as "staffName",
      e."createdAt",
      e."updatedAt",
      e."deletedAt",
      (
        SELECT COUNT(*)
        FROM event_reports er
        WHERE er."eventId" = e.id
      ) as "reportCount",
      r."animalType",
      r.address
    FROM events e
    LEFT JOIN reports r ON r.id = e."representativeReportId"
    LEFT JOIN staffs s ON s.id = e."staffId"
    WHERE ${whereClause}
    ORDER BY e."createdAt" ${sortOrder === 'asc' ? 'ASC' : 'DESC'}
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  // DTOに変換
  const eventDtos: EventDto[] = events.map((e: EventQueryResult) => ({
    id: e.id,
    centerLatitude: e.centerLatitude,
    centerLongitude: e.centerLongitude,
    representativeReportId: e.representativeReportId,
    reportCount: Number(e.reportCount),
    staffId: e.staffId ?? undefined,
    staffName: e.staffName ?? undefined,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    deletedAt: e.deletedAt?.toISOString() ?? null,
    representativeReport: e.animalType
      ? {
          animalType: e.animalType,
          address: e.address || '',
        }
      : undefined,
  }));

  return {
    events: eventDtos,
    totalCount,
    totalPages,
    currentPage: page,
  };
}

/**
 * 通報IDに関連するイベントを取得
 */
export async function getEventByReportId(reportId: string): Promise<{
  id: string;
  reportCount: number;
  representativeReport?: {
    animalType: string;
    address: string;
  };
  reports: {
    id: string;
    animalType: string;
    latitude: number;
    longitude: number;
    address: string;
    createdAt: string;
    status: string;
  }[];
} | null> {
  const eventReport = await prisma.eventReport.findUnique({
    where: { reportId },
    include: {
      event: {
        include: {
          representativeReport: true,
          _count: {
            select: { eventReports: true },
          },
          eventReports: {
            include: {
              report: true,
            },
          },
        },
      },
    },
  });

  if (!eventReport || !eventReport.event) {
    return null;
  }

  const event = eventReport.event;
  return {
    id: event.id,
    reportCount: event._count.eventReports,
    representativeReport: event.representativeReport
      ? {
          animalType: event.representativeReport.animalType,
          address: event.representativeReport.address,
        }
      : undefined,
    reports: event.eventReports.map((er) => ({
      id: er.report.id,
      animalType: er.report.animalType,
      latitude: er.report.latitude,
      longitude: er.report.longitude,
      address: er.report.address,
      createdAt: er.report.createdAt.toISOString(),
      status: er.report.status,
    })),
  };
}

/**
 * Event詳細を取得（所属するReportも含む）
 */
export async function getEventWithReports(eventId: string) {
  // Event情報
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      representativeReport: true,
      staff: true,
      eventReports: {
        include: {
          report: true,
        },
      },
    },
  });

  if (!event) {
    return null;
  }

  return {
    id: event.id,
    centerLatitude: event.centerLatitude,
    centerLongitude: event.centerLongitude,
    representativeReportId: event.representativeReportId,
    staffId: event.staffId ?? undefined,
    staffName: event.staff?.name ?? undefined,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    deletedAt: event.deletedAt?.toISOString() ?? null,
    representativeReport: event.representativeReport
      ? {
          animalType: event.representativeReport.animalType,
          address: event.representativeReport.address,
        }
      : undefined,
    reports: event.eventReports.map((er: (typeof event.eventReports)[number]) => ({
      id: er.report.id,
      animalType: er.report.animalType,
      latitude: er.report.latitude,
      longitude: er.report.longitude,
      address: er.report.address,
      createdAt: er.report.createdAt.toISOString(),
      status: er.report.status,
    })),
  };
}

/**
 * 直近24時間のイベントサマリーを取得
 */
export async function getRecentEvents(): Promise<RecentEventSummaryDto[]> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  type RecentEventRow = {
    id: string;
    area_key: string | null;
    address: string | null;
    animalType: string | null;
    reportCount: bigint;
    createdAt: Date;
    staffId: string | null;
    staffName: string | null;
  };

  const rows = await prisma.$queryRawUnsafe<RecentEventRow[]>(
    `
    SELECT
      e.id,
      r."normalizedAddress"->>'areaKey' AS area_key,
      r.address,
      r."animalType",
      (
        SELECT COUNT(*)
        FROM event_reports er
        WHERE er."eventId" = e.id
      ) AS "reportCount",
      e."createdAt",
      e."staffId",
      s.name AS "staffName"
    FROM events e
    LEFT JOIN reports r ON r.id = e."representativeReportId"
    LEFT JOIN staffs s ON s.id = e."staffId"
    WHERE e."deletedAt" IS NULL
      AND e."createdAt" >= $1
    ORDER BY e."createdAt" DESC
    `,
    twentyFourHoursAgo
  );

  return rows.map((row) => ({
    eventId: row.id,
    areaKey: row.area_key ?? '',
    address: row.address ?? '',
    animalType: row.animalType ?? 'other',
    reportCount: Number(row.reportCount),
    createdAt: row.createdAt.toISOString(),
    staffId: row.staffId ?? undefined,
    staffName: row.staffName ?? undefined,
  }));
}

/**
 * イベントと紐づく通報に担当者を設定
 * @param eventId イベントID
 * @param staffId 担当職員ID
 */
export async function assignStaffToEvent(
  eventId: string,
  staffId: string
): Promise<{ success: boolean; updatedReportCount: number; error?: string }> {
  requireAdmin();

  try {
    // イベントの担当者を更新
    await prisma.event.update({
      where: { id: eventId },
      data: {
        staffId,
        updatedAt: new Date(),
      },
    });

    // 紐づく通報のIDを取得
    const eventReports = await prisma.eventReport.findMany({
      where: { eventId },
      select: { reportId: true },
    });

    const reportIds = eventReports.map((er) => er.reportId);

    // 紐づく通報の担当者を一括更新
    const updateResult = await prisma.report.updateMany({
      where: {
        id: { in: reportIds },
        deletedAt: null,
      },
      data: {
        staffId,
        updatedAt: new Date(),
      },
    });

    // キャッシュ無効化
    revalidatePath('/');
    revalidatePath('/admin/report');

    return {
      success: true,
      updatedReportCount: updateResult.count,
    };
  } catch (error) {
    console.error('担当者設定エラー:', error);
    return {
      success: false,
      updatedReportCount: 0,
      error: error instanceof Error ? error.message : '担当者の設定に失敗しました',
    };
  }
}
