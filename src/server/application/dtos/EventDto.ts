/**
 * Event読み取り用DTO
 *
 * フロントエンドへの返却用データ転送オブジェクト。
 */
export interface EventDto {
  id: string;
  centerLatitude: number;
  centerLongitude: number;
  representativeReportId: string | null;
  reportCount: number;
  staffId?: string; // 担当職員ID
  staffName?: string; // 担当職員名
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  deletedAt: string | null;
  // 代表Reportの情報（結合して取得）
  representativeReport?: {
    animalType: string;
    address: string;
  };
}

/**
 * Event一覧検索結果
 */
export interface SearchEventsResult {
  events: EventDto[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}
