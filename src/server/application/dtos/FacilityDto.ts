/**
 * Facility読み取り用DTO
 *
 * フロントエンドへの返却用データ転送オブジェクト。
 */
export interface FacilityDto {
  id: string;
  staffId: string;
  overpassId: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  isShared: boolean;
  createdAt: string; // ISO 8601
}
