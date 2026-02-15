import type { Prisma } from '@prisma/client';

import prisma from '@/server/infrastructure/database/prisma';
import type { ISystemSettingRepository } from '@/server/domain/repositories/ISystemSettingRepository';
import type { SystemSettingValue } from '@/server/application/dtos/SystemSettingDto';

/**
 * PrismaSystemSettingRepository
 *
 * PostgreSQLを使用したシステム設定の永続化
 * ログ形式で変更履歴を保持し、最新のレコードを参照する
 */
class PrismaSystemSettingRepository implements ISystemSettingRepository {
  async findLatest(): Promise<SystemSettingValue | null> {
    const record = await prisma.systemSetting.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!record) return null;

    return record.value as unknown as SystemSettingValue;
  }

  async create(value: SystemSettingValue): Promise<SystemSettingValue> {
    const record = await prisma.systemSetting.create({
      data: {
        value: value as unknown as Prisma.InputJsonValue,
      },
    });

    return record.value as unknown as SystemSettingValue;
  }
}

export default PrismaSystemSettingRepository;
