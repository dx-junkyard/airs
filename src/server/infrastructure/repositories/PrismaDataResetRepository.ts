import type { IDataResetRepository } from '@/server/domain/repositories/IDataResetRepository';
import prisma from '@/server/infrastructure/database/prisma';

/**
 * PrismaDataResetRepository
 *
 * Prisma + PostgreSQL を使用したデータリセットリポジトリ実装。
 * reports, events, event_reports の全アクティブレコードをトランザクションでsoft-deleteする。
 */
class PrismaDataResetRepository implements IDataResetRepository {
  async softDeleteAll(): Promise<{
    reportsCount: number;
    eventsCount: number;
    eventReportsCount: number;
  }> {
    const now = new Date();

    const [eventReportsResult, eventsResult, reportsResult] =
      await prisma.$transaction([
        prisma.eventReport.updateMany({
          where: { deletedAt: null },
          data: { deletedAt: now },
        }),
        prisma.event.updateMany({
          where: { deletedAt: null },
          data: { deletedAt: now },
        }),
        prisma.report.updateMany({
          where: { deletedAt: null },
          data: { deletedAt: now },
        }),
      ]);

    return {
      reportsCount: reportsResult.count,
      eventsCount: eventsResult.count,
      eventReportsCount: eventReportsResult.count,
    };
  }
}

export default PrismaDataResetRepository;
