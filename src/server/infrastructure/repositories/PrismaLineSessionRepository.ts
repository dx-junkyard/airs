import type { Prisma } from '@prisma/client';

import prisma, { withRetry } from '@/server/infrastructure/database/prisma';
import type {
  ILineSessionRepository,
  LineSessionData,
} from '@/server/domain/repositories/ILineSessionRepository';
import type { SimulationStep } from '@/features/ai-report/types';
import type { LineSessionState } from '@/features/line-bot/types/lineSession';
import GetSystemSettingUseCase from '@/server/application/use-cases/system-setting/GetSystemSettingUseCase';
import PrismaSystemSettingRepository from '@/server/infrastructure/repositories/PrismaSystemSettingRepository';
import { createInitialSessionState } from '@/features/line-bot/types/lineSession';

/**
 * DBから取得したJSON stateを安全にLineSessionStateに変換する
 *
 * JSON列はnullやフィールド欠損の可能性があるため、
 * 初期値をベースにマージして配列フィールドが必ずiterableであることを保証する
 */
function normalizeSessionState(raw: unknown): LineSessionState {
  const defaults = createInitialSessionState();
  if (raw == null || typeof raw !== 'object') {
    return defaults;
  }
  const obj = raw as Record<string, unknown>;
  return {
    ...defaults,
    ...obj,
    // 配列フィールドは必ずArray.isArrayで検証
    images: Array.isArray(obj.images) ? obj.images : defaults.images,
    actionQuestionAnswers: Array.isArray(obj.actionQuestionAnswers)
      ? obj.actionQuestionAnswers
      : defaults.actionQuestionAnswers,
    questionQueue: Array.isArray(obj.questionQueue)
      ? obj.questionQueue
      : defaults.questionQueue,
  };
}

/**
 * デフォルトセッション有効期間: 24時間
 */
const DEFAULT_SESSION_TTL_HOURS = 24;

/**
 * システム設定からセッションTTLを取得（ミリ秒）
 */
async function getSessionTtlMs(): Promise<number> {
  try {
    const repository = new PrismaSystemSettingRepository();
    const useCase = new GetSystemSettingUseCase(repository);
    const setting = await useCase.execute();
    return setting.value.lineSessionTimeoutHours * 60 * 60 * 1000;
  } catch {
    return DEFAULT_SESSION_TTL_HOURS * 60 * 60 * 1000;
  }
}

/**
 * PrismaLineSessionRepository
 *
 * PostgreSQLを使用したLINEセッション永続化
 * Neonコールドスタート対策としてリトライ付き
 */
class PrismaLineSessionRepository implements ILineSessionRepository {
  async findByLineUserId(lineUserId: string): Promise<LineSessionData | null> {
    const session = await withRetry(() =>
      prisma.lineSession.findUnique({
        where: { lineUserId },
      })
    );

    if (!session) return null;

    // 期限切れチェック
    if (session.expiresAt < new Date()) {
      await withRetry(() =>
        prisma.lineSession.delete({ where: { lineUserId } })
      );
      return null;
    }

    return {
      id: session.id,
      lineUserId: session.lineUserId,
      step: session.step as SimulationStep,
      state: normalizeSessionState(session.state),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
    };
  }

  async save(
    lineUserId: string,
    step: SimulationStep,
    state: LineSessionState
  ): Promise<LineSessionData> {
    const ttlMs = await getSessionTtlMs();
    const expiresAt = new Date(Date.now() + ttlMs);

    const session = await withRetry(() =>
      prisma.lineSession.upsert({
        where: { lineUserId },
        create: {
          lineUserId,
          step,
          state: state as unknown as Prisma.InputJsonValue,
          expiresAt,
        },
        update: {
          step,
          state: state as unknown as Prisma.InputJsonValue,
          expiresAt,
        },
      })
    );

    return {
      id: session.id,
      lineUserId: session.lineUserId,
      step: session.step as SimulationStep,
      state: normalizeSessionState(session.state),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
    };
  }

  async deleteByLineUserId(lineUserId: string): Promise<void> {
    await withRetry(() =>
      prisma.lineSession.deleteMany({ where: { lineUserId } })
    );
  }

  async deleteExpired(): Promise<number> {
    const result = await withRetry(() =>
      prisma.lineSession.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      })
    );
    return result.count;
  }
}

export default PrismaLineSessionRepository;
