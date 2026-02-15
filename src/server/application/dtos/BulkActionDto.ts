/**
 * インポート進捗情報（processing中にresult JSONに保存される）
 */
export interface BulkImportProgress {
  phase: 'importing' | 'clustering';
  /** 通報: 全件数 */
  importTotal: number;
  /** 通報: 成功件数 */
  importSuccess: number;
  /** 通報: エラー件数 */
  importError: number;
  /** 通報グループ: 対象件数 */
  clusterTotal: number;
  /** 通報グループ: 処理済み件数 */
  clusterDone: number;
}

/**
 * インポート最終結果（completed時にresult JSONに保存される）
 */
export interface BulkImportResult {
  phase: 'done';
  importTotal: number;
  importSuccess: number;
  importError: number;
  clusterTotal: number;
  clusterDone: number;
  /** イベント作成数 */
  eventsCreated: number;
  /** バリデーションエラー詳細 */
  errors: Array<{ row: number; message: string }>;
}

/**
 * BulkAction DTO
 *
 * 一括操作のステータス情報をクライアントに返すための型
 */
export interface BulkActionDto {
  id: string;
  actionKey: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl: string;
  staffName: string | null;
  totalCount: number;
  successCount: number;
  errorCount: number;
  result: BulkImportProgress | BulkImportResult | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
