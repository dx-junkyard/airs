/**
 * CSV行エラー情報
 */
export interface CsvRowError {
  row: number;
  message: string;
}

/**
 * CSVインポート結果DTO
 */
export interface CsvImportResultDto {
  successCount: number;
  errorCount: number;
  errors: CsvRowError[];
}
