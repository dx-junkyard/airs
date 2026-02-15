/**
 * StaffLocation読み取り用DTO
 *
 * フロントエンドへの返却用データ転送オブジェクト。
 */
export interface StaffLocationDto {
  id: string;
  staffId: string;
  latitude: number;
  longitude: number;
  label: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
