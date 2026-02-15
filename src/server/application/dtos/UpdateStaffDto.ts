/**
 * Staff更新用DTO
 *
 * 職員更新時の入力データ転送オブジェクト。
 */
export interface UpdateStaffDto {
  name?: string;
  email?: string | null;
}
