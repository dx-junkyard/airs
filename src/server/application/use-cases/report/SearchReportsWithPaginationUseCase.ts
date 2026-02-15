import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import AnimalType from '@/server/domain/value-objects/AnimalType';
import ReportStatus from '@/server/domain/value-objects/ReportStatus';
import SortOrder from '@/server/domain/value-objects/SortOrder';
import ReportMapper from '@/server/infrastructure/mappers/ReportMapper';

/**
 * 検索パラメータ
 */
export interface SearchReportsParams {
  query?: string;
  status?: string;
  animalType?: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: string;
  page: number;
  limit: number;
}

/**
 * 検索結果
 */
export interface SearchReportsResult {
  reports: ReportDto[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

/**
 * SearchReportsWithPaginationUseCase
 *
 * フィルタリング・ソート・ページネーション付きで通報を検索するユースケース
 */
class SearchReportsWithPaginationUseCase {
  constructor(private repository: IReportRepository) {}

  async execute(params: SearchReportsParams): Promise<SearchReportsResult> {
    const {
      query,
      status,
      animalType,
      staffId,
      startDate,
      endDate,
      sortOrder,
      page,
      limit,
    } = params;

    // 値オブジェクトに変換
    let statusVO: ReportStatus | undefined;
    let statusesVO: ReportStatus[] | undefined;

    if (status && status !== 'all') {
      if (status.includes(',')) {
        statusesVO = status.split(',').map((s) => ReportStatus.create(s.trim()));
      } else {
        statusVO = ReportStatus.create(status);
      }
    }

    const animalTypeVO = animalType && animalType !== 'all' ? AnimalType.create(animalType) : undefined;
    const sortOrderVO = sortOrder ? SortOrder.create(sortOrder) : SortOrder.DESC;
    const staffIdFilter = staffId && staffId !== 'all' ? staffId : undefined;

    // 日付変換
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    // ページ番号・件数を安全な値にクランプ
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);

    const filterParams = {
      query,
      status: statusVO,
      statuses: statusesVO,
      animalType: animalTypeVO,
      staffId: staffIdFilter,
      startDate: startDateObj,
      endDate: endDateObj,
      sortOrder: sortOrderVO,
      limit: safeLimit,
    };

    let result = await this.repository.findWithFilters({
      ...filterParams,
      page: safePage,
    });

    const totalPages = Math.ceil(result.totalCount / safeLimit);

    // ページが総ページ数を超えている場合、最終ページで再取得
    if (safePage > totalPages && totalPages > 0) {
      result = await this.repository.findWithFilters({
        ...filterParams,
        page: totalPages,
      });
    }

    const currentPage = totalPages > 0 ? Math.min(safePage, totalPages) : 1;

    return {
      reports: result.reports.map((report) => ReportMapper.toDto(report)),
      totalCount: result.totalCount,
      totalPages,
      currentPage,
    };
  }
}

export default SearchReportsWithPaginationUseCase;
