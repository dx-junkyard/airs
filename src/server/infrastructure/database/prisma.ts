import { PrismaClient } from '@prisma/client';

/**
 * PrismaClientシングルトン
 *
 * Next.js開発環境でホットリロード時に複数のインスタンスが作成されないよう、
 * globalに保持する。
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Prisma操作のリトライラッパー
 *
 * Neonサーバーレス PostgreSQL のコールドスタートや一時的な接続エラーに対応。
 * PrismaClientInitializationError（接続不可）とコネクションプールタイムアウトをリトライする。
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 500
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      const isRetryable =
        error instanceof Error &&
        (error.constructor.name === 'PrismaClientInitializationError' ||
          error.message.includes('connection pool'));

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(
        `[Prisma] Retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries}):`,
        error.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('withRetry: unreachable');
}

export default prisma;
