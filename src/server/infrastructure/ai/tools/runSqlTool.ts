import { tool, zodSchema } from 'ai';
import { z } from 'zod';
import SqlQueryExecutor from '@/server/infrastructure/repositories/SqlQueryExecutor';

// Input schema for the SQL tool
const sqlInputSchema = z.object({
  sql: z
    .string()
    .describe(
      '実行するSQLクエリ（SELECT文のみ、reports/events/event_reportsテーブル）'
    ),
});

type SqlInput = z.infer<typeof sqlInputSchema>;

const SQL_GUARD_ERROR_PATTERNS = [
  'SELECT文のみ許可されています',
  '禁止されたキーワード',
  'FROM句が見つかりません',
  'テーブル "',
] as const;

function isSqlGuardError(error?: string): boolean {
  if (!error) return false;
  return SQL_GUARD_ERROR_PATTERNS.some((pattern) => error.includes(pattern));
}

/**
 * SQL実行ツール
 *
 * LLMが生成したSQLクエリを実行し、結果を返す
 */
export const runSqlTool = tool({
  description: `野生動物目撃通報・通報グループデータベースに対してSQLクエリを実行します。
SELECT文のみ許可され、reports, staffs, events, event_reportsテーブルにアクセス可能です。

【重要】このツールは集計・分析クエリ（COUNT, GROUP BY等）専用です。地図は更新されません。
通報データの検索・地図表示には searchReports ツールを使用してください。

削除済みレコードを除外するため、WHERE "deletedAt" IS NULL を含めてください。
複数テーブルをJOINする場合は、各テーブルでdeletedAt条件を指定してください。`,
  inputSchema: zodSchema(sqlInputSchema),
  execute: async ({ sql }: SqlInput) => {
    const executor = new SqlQueryExecutor();
    const result = await executor.execute(sql);

    if (result.success) {
      return {
        success: true,
        data: result.data,
        rowCount: result.rowCount,
        error: null,
      };
    }

    const error = isSqlGuardError(result.error)
      ? `${result.error}。SQLガードに抵触しました。クエリを修正して runSql を再実行してください。`
      : result.error;
    return {
      success: false,
      error,
      data: null,
      rowCount: 0,
    };
  },
});
