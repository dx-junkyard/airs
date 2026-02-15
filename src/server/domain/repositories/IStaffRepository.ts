import type Staff from '@/server/domain/models/Staff';
import type StaffId from '@/server/domain/models/StaffId';
import type SortOrder from '@/server/domain/value-objects/SortOrder';
import type { CreateStaffDto } from '@/server/application/dtos/CreateStaffDto';
import type { StaffReportCounts } from '@/server/application/dtos/StaffDto';

/**
 * Staffリポジトリのインターフェース
 *
 * Staffエンティティの永続化を抽象化する。
 */
export interface IStaffRepository {
  /**
   * すべての職員を取得（削除済み除外）
   * @param sortOrder ソート順（省略時は降順）
   */
  findAll(sortOrder?: SortOrder): Promise<Staff[]>;

  /**
   * IDで職員を検索
   * @param id 職員ID
   */
  findById(id: StaffId): Promise<Staff | undefined>;

  /**
   * 新規職員を作成（IDは自動発行）
   * @param dto 作成用DTO
   */
  create(dto: CreateStaffDto): Promise<Staff>;

  /**
   * 既存職員を保存（更新）
   * @param staff 職員エンティティ
   */
  save(staff: Staff): Promise<Staff>;

  /**
   * 職員を論理削除
   * @param id 職員ID
   */
  softDelete(id: StaffId): Promise<boolean>;

  /**
   * 各職員の担当通報件数を取得（確認待ち）
   * @param staffIds 職員IDの配列
   * @returns 職員IDごとの通報件数マップ
   */
  getReportCountsByStaffIds(
    staffIds: string[]
  ): Promise<Map<string, StaffReportCounts>>;
}
