import type {
  IAdminPasswordRepository,
  AdminPasswordInfo,
} from '@/server/domain/repositories/IAdminPasswordRepository';
import prisma from '@/server/infrastructure/database/prisma';

/**
 * PrismaAdminPasswordRepository
 *
 * Prisma + PostgreSQL を使用したAdminPasswordリポジトリ実装。
 * 新規作成時に既存のアクティブなレコードをsoft-deleteする。
 */
class PrismaAdminPasswordRepository implements IAdminPasswordRepository {
  async create(hashedPassword: string, staffId: string): Promise<void> {
    const now = new Date();

    await prisma.$transaction([
      // 既存のアクティブなレコードをsoft-delete
      prisma.adminPassword.updateMany({
        where: { deletedAt: null },
        data: { deletedAt: now },
      }),
      // 新規作成
      prisma.adminPassword.create({
        data: { hashedPassword, staffId },
      }),
    ]);
  }

  async findLatest(): Promise<string | undefined> {
    const record = await prisma.adminPassword.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return record?.hashedPassword;
  }

  async findLatestInfo(): Promise<AdminPasswordInfo | undefined> {
    const record = await prisma.adminPassword.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { staff: true },
    });
    if (!record) return undefined;
    return {
      staffName: record.staff?.name ?? '不明',
      createdAt: record.createdAt.toISOString(),
    };
  }
}

export default PrismaAdminPasswordRepository;
