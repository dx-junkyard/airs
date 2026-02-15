import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import SortOrder from '@/server/domain/value-objects/SortOrder';
import ReportMapper from '@/server/infrastructure/mappers/ReportMapper';
import type { MapDefaultDataRangeValue } from '@/server/domain/constants/mapDefaultDataRange';

/**
 * GetReportsUseCase
 *
 * すべての通報取得のユースケース
 */
class GetReportsUseCase {
  constructor(private repository: IReportRepository) {}

  /**
   * 通報一覧を取得
   * @param sortOrder ソート順（'asc' | 'desc'）省略時は降順
   */
  async execute(options?: {
    sortOrder?: string;
    startDate?: Date;
    endDate?: Date;
    mapDefaultDataRange?: MapDefaultDataRangeValue;
  }): Promise<ReportDto[]> {
    const sort = options?.sortOrder
      ? SortOrder.create(options.sortOrder)
      : SortOrder.DESC;
    const reports = await this.repository.findAll({
      sortOrder: sort,
      startDate: options?.startDate,
      endDate: options?.endDate,
      mapDefaultDataRange: options?.mapDefaultDataRange,
    });

    return reports.map((report) => ReportMapper.toDto(report));
  }
}

export default GetReportsUseCase;
