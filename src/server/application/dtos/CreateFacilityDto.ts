/**
 * Facility作成用DTO
 *
 * 周辺施設登録時の入力データ転送オブジェクト。
 */
export interface CreateFacilityDto {
  staffId: string;
  overpassId?: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
}
