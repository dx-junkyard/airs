import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import ReportMapper from '@/server/infrastructure/mappers/ReportMapper';

/**
 * SearchReportsUseCase
 *
 * 通報検索のユースケース
 */
class SearchReportsUseCase {
  constructor(private repository: IReportRepository) {}

  async execute(query: string): Promise<ReportDto[]> {
    const reports = await this.repository.search(query);

    return reports.map((report) => ReportMapper.toDto(report));
  }
}

export default SearchReportsUseCase;
