/**
 * Analysis Feature Types
 *
 * 分析チャット機能の型定義
 */

/**
 * おすすめ質問
 */
export interface SuggestedQuestion {
  id: string;
  text: string;
}

/**
 * SQL実行結果
 */
export interface SqlQueryResult {
  success: boolean;
  data: Record<string, unknown>[] | null;
  rowCount: number;
  error: string | null;
}

/**
 * ツール呼び出しの引数
 */
export interface RunSqlArgs {
  sql: string;
}

/**
 * ツール呼び出し結果
 */
export interface ToolInvocation {
  toolName: string;
  toolCallId: string;
  state: 'partial-call' | 'call' | 'result';
  args?: RunSqlArgs;
  result?: SqlQueryResult;
}

/**
 * チャットメッセージの拡張型（ツール呼び出しを含む）
 */
export interface AnalysisMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolInvocations?: ToolInvocation[];
  createdAt?: Date;
}
