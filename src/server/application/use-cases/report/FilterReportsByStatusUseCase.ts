import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import ReportStatus from '@/server/domain/value-objects/ReportStatus';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import ReportMapper from '@/server/infrastructure/mappers/ReportMapper';

/**
 * FilterReportsByStatusUseCase
 *
 * ステータスで通報をフィルターするユースケース
 */
class FilterReportsByStatusUseCase {
  constructor(private repository: IReportRepository) {}

  async execute(status: string): Promise<ReportDto[]> {
    const reportStatus = ReportStatus.create(status);
    const reports = await this.repository.filterByStatus(reportStatus);

    return reports.map((report) => ReportMapper.toDto(report));
  }
}

export default FilterReportsByStatusUseCase;
