/**
 * StaffLocation作成用DTO
 *
 * 担当地域ピン作成時の入力データ転送オブジェクト。
 */
export interface CreateStaffLocationDto {
  staffId: string;
  latitude: number;
  longitude: number;
  label?: string | null;
}
