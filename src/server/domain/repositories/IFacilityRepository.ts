import type Facility from '@/server/domain/models/Facility';
import type FacilityId from '@/server/domain/models/FacilityId';
import type StaffId from '@/server/domain/models/StaffId';

/**
 * Facilityリポジトリのインターフェース
 *
 * 周辺施設の永続化を抽象化する。
 */
export interface IFacilityRepository {
  /**
   * 職員IDで施設一覧を取得（削除済み除外）
   */
  findByStaffId(staffId: StaffId): Promise<Facility[]>;

  /**
   * 職員IDとOverpass IDで施設を取得（重複チェック用）
   */
  findByStaffIdAndOverpassId(
    staffId: StaffId,
    overpassId: string
  ): Promise<Facility | undefined>;

  /**
   * 全施設を取得（削除済み除外）
   */
  findAll(): Promise<Facility[]>;

  /**
   * 全体共有の施設一覧を取得（削除済み除外）
   */
  findShared(): Promise<Facility[]>;

  /**
   * 施設を作成
   */
  create(
    staffId: StaffId,
    overpassId: string | null,
    name: string,
    category: string,
    latitude: number,
    longitude: number
  ): Promise<Facility>;

  /**
   * 全体共有フラグを更新
   */
  updateShared(id: FacilityId, isShared: boolean): Promise<Facility>;

  /**
   * 施設を論理削除
   */
  softDelete(id: FacilityId): Promise<boolean>;
}
