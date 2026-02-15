/**
 * 担当通報件数
 */
export interface StaffReportCounts {
  waiting: number;
}

/**
 * Staff読み取り用DTO
 *
 * フロントエンドへの返却用データ転送オブジェクト。
 */
export interface StaffDto {
  id: string;
  name: string;
  email: string | null;
  reportCounts?: StaffReportCounts;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  deletedAt: string | null; // ISO 8601 or null
}
