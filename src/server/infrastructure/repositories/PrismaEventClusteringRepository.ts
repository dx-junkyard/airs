import prisma from '@/server/infrastructure/database/prisma';
import type {
  ClusteringConfig,
  IEventClusteringRepository,
} from '@/server/domain/repositories/IEventClusteringRepository';

/**
 * マッチするイベントの検索結果型
 */
interface MatchingEvent {
  eventId: string;
}

/**
 * マッチする待機中通報の検索結果型
 */
interface MatchingPendingReport {
  reportId: string;
}

/**
 * 通報情報型（イベント作成用）
 */
interface ReportForEvent {
  id: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

/**
 * PrismaEventClusteringRepository
 *
 * PostGISを使用したイベントクラスタリングリポジトリの実装
 */
class PrismaEventClusteringRepository implements IEventClusteringRepository {
  /**
   * 指定した通報に近接する既存イベントを検索
   *
   * 条件:
   * - イベントの中心座標から距離閾値以内
   * - イベントの最新通報から時間閾値以内
   * - 同じ獣種の通報が所属している
   */
  async findMatchingEvent(
    reportId: string,
    animalType: string,
    createdAt: Date,
    config: ClusteringConfig
  ): Promise<string | null> {
    const timeThreshold = new Date(
      createdAt.getTime() - config.timeMinutes * 60 * 1000
    );

    const result = await prisma.$queryRawUnsafe<MatchingEvent[]>(
      `
      WITH report_location AS (
        SELECT location FROM reports WHERE id = $1
      ),
      event_latest_time AS (
        SELECT
          e.id as "eventId",
          e."centerLocation",
          MAX(r."createdAt") as "latestReportTime"
        FROM events e
        JOIN event_reports er ON er."eventId" = e.id
        JOIN reports r ON r.id = er."reportId"
        WHERE e."deletedAt" IS NULL
          AND r."deletedAt" IS NULL
        GROUP BY e.id, e."centerLocation"
      )
      SELECT elt."eventId"
      FROM event_latest_time elt, report_location rl
      WHERE elt."centerLocation" IS NOT NULL
        AND rl.location IS NOT NULL
        AND ST_DWithin(
          elt."centerLocation"::geography,
          rl.location::geography,
          $2
        )
        AND elt."latestReportTime" >= $3
        AND EXISTS (
          SELECT 1 FROM event_reports er2
          JOIN reports r2 ON r2.id = er2."reportId"
          WHERE er2."eventId" = elt."eventId"
            AND r2."animalType" = $4
            AND r2."deletedAt" IS NULL
        )
      ORDER BY ST_Distance(
        elt."centerLocation"::geography,
        rl.location::geography
      )
      LIMIT 1
    `,
      reportId,
      config.distanceMeters,
      timeThreshold,
      animalType
    );

    return result.length > 0 ? result[0].eventId : null;
  }

  /**
   * 指定した通報に近接する待機中通報を検索
   *
   * 条件:
   * - 対象通報から距離閾値以内
   * - 対象通報から時間閾値以内に作成
   * - 同じ獣種
   * - イベント未所属
   */
  async findMatchingPendingReport(
    reportId: string,
    animalType: string,
    createdAt: Date,
    pendingReportIds: string[],
    config: ClusteringConfig
  ): Promise<string | null> {
    if (pendingReportIds.length === 0) {
      return null;
    }

    const timeThreshold = new Date(
      createdAt.getTime() - config.timeMinutes * 60 * 1000
    );

    const result = await prisma.$queryRawUnsafe<MatchingPendingReport[]>(
      `
      WITH current_report AS (
        SELECT location, "createdAt" FROM reports WHERE id = $1
      )
      SELECT r.id as "reportId"
      FROM reports r, current_report cr
      WHERE r.id = ANY($2::text[])
        AND r."animalType" = $3
        AND r."deletedAt" IS NULL
        AND r.location IS NOT NULL
        AND cr.location IS NOT NULL
        AND ST_DWithin(
          r.location::geography,
          cr.location::geography,
          $4
        )
        AND r."createdAt" >= $5
      ORDER BY ST_Distance(
        r.location::geography,
        cr.location::geography
      )
      LIMIT 1
    `,
      reportId,
      pendingReportIds,
      animalType,
      config.distanceMeters,
      timeThreshold
    );

    return result.length > 0 ? result[0].reportId : null;
  }

  /**
   * 通報が指定座標から距離閾値以内にあるかPostGISで判定
   */
  async isWithinDistance(
    reportId: string,
    longitude: number,
    latitude: number,
    distanceMeters: number
  ): Promise<boolean> {
    const result = await prisma.$queryRawUnsafe<Array<{ within: boolean }>>(
      `
      SELECT ST_DWithin(
        r.location::geography,
        ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
        $4
      ) as "within"
      FROM reports r
      WHERE r.id = $1
        AND r.location IS NOT NULL
      `,
      reportId,
      longitude,
      latitude,
      distanceMeters
    );

    return result.length > 0 && result[0].within;
  }

  /**
   * 2つの通報から新規イベントを作成
   *
   * - 中心座標: 最初（古い方）の通報の緯度経度
   * - createdAt: 最初の通報のcreatedAt
   * - updatedAt: 最後（新しい方）の通報のcreatedAt
   */
  async createEventWithReports(
    reportId1: string,
    reportId2: string
  ): Promise<string> {
    // 両方の通報情報を取得（createdAt順）
    const reports = await prisma.$queryRawUnsafe<ReportForEvent[]>(
      `
      SELECT
        id,
        latitude,
        longitude,
        "createdAt"
      FROM reports
      WHERE id IN ($1, $2) AND location IS NOT NULL
      ORDER BY "createdAt" ASC
    `,
      reportId1,
      reportId2
    );

    if (reports.length === 0) {
      throw new Error(`Reports ${reportId1}, ${reportId2} have no location`);
    }

    const firstReport = reports[0];
    const lastReport = reports[reports.length - 1];

    // Event作成（centerLocationもPostGIS geometryで設定）
    const lat = firstReport.latitude;
    const lng = firstReport.longitude;
    const eventRows = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO events (
        id, "representativeReportId", "centerLatitude", "centerLongitude",
        "centerLocation", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${firstReport.id},
        ${lat},
        ${lng},
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        ${firstReport.createdAt},
        ${lastReport.createdAt}
      )
      RETURNING id
    `;
    const event = eventRows[0];

    // EventReport作成
    await prisma.eventReport.createMany({
      data: [
        { eventId: event.id, reportId: reportId1 },
        { eventId: event.id, reportId: reportId2 },
      ],
    });

    return event.id;
  }

  /**
   * 既存イベントに通報を追加
   *
   * - EventReportを作成
   * - EventのupdatedAtを通報のcreatedAtで更新
   */
  async addReportToEvent(eventId: string, reportId: string): Promise<void> {
    // 通報のcreatedAtを取得
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { createdAt: true },
    });

    // EventReport作成
    await prisma.eventReport.create({
      data: {
        eventId,
        reportId,
      },
    });

    // EventのupdatedAtを更新
    if (report) {
      await prisma.event.update({
        where: { id: eventId },
        data: { updatedAt: report.createdAt },
      });
    }
  }

  /**
   * 待機中（イベント未所属かつ時間閾値内）の通報IDリストを取得
   */
  async getPendingReportIds(
    beforeDate: Date,
    config: ClusteringConfig
  ): Promise<string[]> {
    const cutoffTime = new Date(
      beforeDate.getTime() - config.timeMinutes * 60 * 1000
    );

    const reports = await prisma.report.findMany({
      where: {
        deletedAt: null,
        createdAt: {
          gte: cutoffTime,
          lt: beforeDate,
        },
        eventReports: {
          none: {},
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return reports.map((r) => r.id);
  }

  /**
   * 通報IDからイベントIDを取得
   */
  async findEventIdByReportId(reportId: string): Promise<string | null> {
    const eventReport = await prisma.eventReport.findFirst({
      where: {
        reportId,
        event: {
          deletedAt: null,
        },
      },
      select: {
        eventId: true,
      },
    });

    return eventReport?.eventId ?? null;
  }

  /**
   * イベントの担当職員IDを更新
   */
  async updateEventStaffId(
    eventId: string,
    staffId: string | null
  ): Promise<void> {
    await prisma.event.update({
      where: { id: eventId },
      data: {
        staffId: staffId,
        updatedAt: new Date(),
      },
    });
  }
}

export default PrismaEventClusteringRepository;
