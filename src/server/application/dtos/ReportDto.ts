import type { ReportImage } from '@/server/domain/value-objects/ImageUrls';

/**
 * Report読み取り用DTO
 *
 * フロントエンドへの返却用データ転送オブジェクト。
 */
export interface ReportDto {
  id: string;
  animalType: string;
  latitude: number;
  longitude: number;
  address: string;
  phoneNumber?: string;
  images: ReportImage[];
  description?: string;
  status: string;
  staffId?: string; // 担当職員ID
  staffName?: string; // 担当職員名
  areaKey?: string; // normalizedAddressから抽出したエリアキー（都道府県+市区町村+大字+字）
  areaRegionLabel?: string; // 地域ラベル（都道府県+市区町村）
  areaChomeLabel?: string; // 丁目ラベル（大字+字）
  eventId?: string; // 所属イベントID（読み取り専用）
  eventReportCount?: number; // イベント内の通報件数（読み取り専用）
  hasOnlyDate: boolean; // 日付のみ（時刻情報なし）
  createdAt: string; // ISO 8601
  deletedAt: string | null; // ISO 8601 or null
  updatedAt: string; // ISO 8601
}
