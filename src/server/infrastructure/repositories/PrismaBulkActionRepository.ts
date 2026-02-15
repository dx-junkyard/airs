import type { BulkAction } from '@prisma/client';
import type {
  IBulkActionRepository,
  BulkActionUpdateData,
} from '@/server/domain/repositories/IBulkActionRepository';
import prisma from '@/server/infrastructure/database/prisma';

/**
 * PrismaBulkActionRepository
 *
 * Prisma + PostgreSQL を使用したBulkActionリポジトリ実装。
 */
class PrismaBulkActionRepository implements IBulkActionRepository {
  async create(data: {
    actionKey: string;
    fileUrl: string;
    staffId?: string;
  }): Promise<BulkAction> {
    return prisma.bulkAction.create({
      data: {
        actionKey: data.actionKey,
        status: 'pending',
        fileUrl: data.fileUrl,
        staffId: data.staffId ?? null,
      },
    });
  }

  async findById(id: string): Promise<BulkAction | null> {
    return prisma.bulkAction.findUnique({
      where: { id },
    });
  }

  async findLatestByActionKey(
    actionKey: string
  ): Promise<BulkAction | null> {
    return prisma.bulkAction.findFirst({
      where: { actionKey },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRecent(
    limit: number
  ): Promise<
    Array<BulkAction & { staff: { id: string; name: string } | null }>
  > {
    return prisma.bulkAction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        staff: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    data: BulkActionUpdateData
  ): Promise<BulkAction> {
    return prisma.bulkAction.update({
      where: { id },
      data,
    });
  }
}

export default PrismaBulkActionRepository;
