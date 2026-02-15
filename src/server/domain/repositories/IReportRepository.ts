import type Report from '@/server/domain/models/Report';
import type ReportId from '@/server/domain/models/ReportId';
import type AnimalType from '@/server/domain/value-objects/AnimalType';
import type ReportStatus from '@/server/domain/value-objects/ReportStatus';
import type SortOrder from '@/server/domain/value-objects/SortOrder';
import type { CreateReportDto } from '@/server/application/dtos/CreateReportDto';
import type { MapDefaultDataRangeValue } from '@/server/domain/constants/mapDefaultDataRange';

/**
 * Reportリポジトリのインターフェース
 *
 * Reportエンティティの永続化を抽象化する。
 */
export interface IReportRepository {
  /**
   * すべての通報を取得（削除済み除外）
   * @param options オプション（ソート順、日付範囲）
   */
  findAll(options?: {
    sortOrder?: SortOrder;
    startDate?: Date;
    endDate?: Date;
    mapDefaultDataRange?: MapDefaultDataRangeValue;
  }): Promise<Report[]>;

  /**
   * すべての通報を取得（削除済み含む）
   */
  findAllIncludingDeleted(): Promise<Report[]>;

  /**
   * IDで通報を検索
   * @param id 通報ID
   */
  findById(id: ReportId): Promise<Report | undefined>;

  /**
   * 新規通報を作成（IDは自動発行）
   * @param dto 作成用DTO
   */
  create(dto: CreateReportDto): Promise<Report>;

  /**
   * 複数の通報を一括作成（IDは自動発行）
   * @param dtos 作成用DTO配列
   * @returns 作成された通報の基本情報配列
   */
  createMany(
    dtos: CreateReportDto[]
  ): Promise<
    Array<{
      id: string;
      animalType: string;
      latitude: number;
      longitude: number;
      hasOnlyDate: boolean;
      createdAt: Date;
    }>
  >;

  /**
   * 通報のPostGIS location列を緯度経度から一括更新
   * @param ids 対象通報IDリスト
   */
  updateLocations(ids: string[]): Promise<void>;

  /**
   * 既存通報を保存（更新）
   * @param report 通報エンティティ
   */
  save(report: Report): Promise<Report>;

  /**
   * 通報を論理削除
   * @param id 通報ID
   */
  softDelete(id: ReportId): Promise<boolean>;

  /**
   * ステータスで通報をフィルター
   * @param status ステータス
   */
  filterByStatus(status: ReportStatus): Promise<Report[]>;

  /**
   * 獣種で通報をフィルター
   * @param animalType 獣種
   */
  filterByAnimalType(animalType: AnimalType): Promise<Report[]>;

  /**
   * クエリで通報を検索
   * @param query 検索クエリ
   */
  search(query: string): Promise<Report[]>;

  /**
   * エリア別通報件数を取得（丁目単位）
   * @param options オプション（取得件数上限、日付範囲）
   * @returns エリア名と件数の配列（件数降順）
   */
  countByArea(options?: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<
    Array<{
      areaKey: string;
      regionLabel: string;
      chomeLabel: string;
      count: number;
    }>
  >;

  /**
   * フィルター・ソート・ページネーション付きで通報を検索
   * @param params 検索パラメータ
   * @returns 通報一覧と総件数
   */
  findWithFilters(params: ReportFilterParams): Promise<ReportFilterResult>;
}

/**
 * 通報検索のフィルターパラメータ
 */
export interface ReportFilterParams {
  /** 検索クエリ（住所、説明で部分一致） */
  query?: string;
  /** ステータスフィルター（単一） */
  status?: ReportStatus;
  /** ステータスフィルター（複数） */
  statuses?: ReportStatus[];
  /** 獣種フィルター */
  animalType?: AnimalType;
  /** 担当者IDフィルター */
  staffId?: string;
  /** 開始日 */
  startDate?: Date;
  /** 終了日 */
  endDate?: Date;
  /** ソート順 */
  sortOrder?: SortOrder;
  /** ページ番号（1始まり） */
  page: number;
  /** 1ページあたりの件数 */
  limit: number;
}

/**
 * 通報検索の結果
 */
export interface ReportFilterResult {
  /** 通報一覧（ページネーション適用後） */
  reports: Report[];
  /** 総件数（フィルター適用後、ページネーション前） */
  totalCount: number;
}
