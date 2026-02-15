import type StaffLocation from '@/server/domain/models/StaffLocation';
import type StaffId from '@/server/domain/models/StaffId';
import type StaffLocationId from '@/server/domain/models/StaffLocationId';

/**
 * StaffLocationリポジトリのインターフェース
 *
 * 職員担当地域ピンの永続化を抽象化する。
 */
export interface IStaffLocationRepository {
  /**
   * 職員IDで担当地域ピンを取得（削除済み除外）
   */
  findByStaffId(staffId: StaffId): Promise<StaffLocation[]>;

  /**
   * すべての担当地域ピンを取得（削除済み除外）
   */
  findAll(): Promise<StaffLocation[]>;

  /**
   * IDで担当地域ピンを取得
   */
  findById(id: StaffLocationId): Promise<StaffLocation | undefined>;

  /**
   * 担当地域ピンを作成
   */
  create(
    staffId: StaffId,
    latitude: number,
    longitude: number,
    label: string | null
  ): Promise<StaffLocation>;

  /**
   * 担当地域ピンを更新
   */
  save(staffLocation: StaffLocation): Promise<StaffLocation>;

  /**
   * 担当地域ピンを論理削除
   */
  softDelete(id: StaffLocationId): Promise<boolean>;
}
