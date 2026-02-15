import type { ReportImage } from '@/server/domain/value-objects/ImageUrls';

/**
 * Report更新用DTO
 *
 * 通報更新時の入力データ転送オブジェクト。
 * すべてのフィールドがオプション（部分更新対応）。
 */
export interface UpdateReportDto {
  animalType?: string;
  latitude?: string; // FormDataから来るため文字列
  longitude?: string; // FormDataから来るため文字列
  address?: string;
  phoneNumber?: string;
  images?: ReportImage[];
  description?: string;
  status?: string;
  staffId?: string | null; // 担当職員ID（null可：担当解除）
}
