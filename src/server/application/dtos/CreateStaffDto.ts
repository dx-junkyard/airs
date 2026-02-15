/**
 * Staff作成用DTO
 *
 * 新規職員作成時の入力データ転送オブジェクト。
 */
export interface CreateStaffDto {
  name: string;
  email?: string;
}
