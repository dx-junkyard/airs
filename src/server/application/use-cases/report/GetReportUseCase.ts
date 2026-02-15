import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import ReportId from '@/server/domain/models/ReportId';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import ReportMapper from '@/server/infrastructure/mappers/ReportMapper';

/**
 * GetReportUseCase
 *
 * 通報取得のユースケース
 */
class GetReportUseCase {
  constructor(private repository: IReportRepository) {}

  async execute(id: string): Promise<ReportDto | undefined> {
    const reportId = ReportId.create(id);
    const report = await this.repository.findById(reportId);

    if (!report) {
      return undefined;
    }

    return ReportMapper.toDto(report);
  }
}

export default GetReportUseCase;
