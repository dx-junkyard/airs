import prisma from '@/server/infrastructure/database/prisma';
import SqlSecurityService from '@/server/domain/services/SqlSecurityService';

export interface QueryResult {
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
  rowCount?: number;
}

/**
 * SqlQueryExecutor
 *
 * 生SQLクエリを安全に実行するためのリポジトリ
 */
class SqlQueryExecutor {
  private securityService: SqlSecurityService;

  constructor() {
    this.securityService = new SqlSecurityService();
  }

  /**
   * SQLクエリを実行する
   */
  async execute(sql: string): Promise<QueryResult> {
    // セキュリティ検証
    const validation = this.securityService.validate(sql);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    try {
      const sanitizedSql = validation.sanitizedSql!;

      // 生SQLを実行（$queryRawUnsafeを使用）
      const result = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        sanitizedSql
      );

      // BigInt → Number変換
      const convertedResult = this.convertBigIntToNumber(result);

      return {
        success: true,
        data: convertedResult,
        rowCount: convertedResult.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '不明なエラーが発生しました';
      return {
        success: false,
        error: `クエリ実行エラー: ${errorMessage}`,
      };
    }
  }

  /**
   * BigIntをNumberに変換する（JSONシリアライズ対応）
   */
  private convertBigIntToNumber(
    data: Record<string, unknown>[]
  ): Record<string, unknown>[] {
    return data.map((row) => {
      const convertedRow: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'bigint') {
          convertedRow[key] = Number(value);
        } else if (value instanceof Date) {
          convertedRow[key] = value.toISOString();
        } else {
          convertedRow[key] = value;
        }
      }
      return convertedRow;
    });
  }
}

export default SqlQueryExecutor;
