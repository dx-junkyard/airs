import type { ReportImage } from '@/server/domain/value-objects/ImageUrls';
import type { StructuredAddress } from '@/server/domain/models/geo/StructuredAddressModel';

/**
 * Report作成用DTO
 *
 * 新規通報作成時の入力データ転送オブジェクト。
 */
export interface CreateReportDto {
  animalType: string;
  latitude: string; // FormDataから来るため文字列
  longitude: string; // FormDataから来るため文字列
  address: string;
  phoneNumber?: string;
  images: ReportImage[];
  description?: string;
  normalizedAddress?: StructuredAddress;
  hasOnlyDate?: boolean;
  createdAt?: string;
}
