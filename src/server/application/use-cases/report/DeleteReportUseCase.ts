import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import ReportId from '@/server/domain/models/ReportId';

/**
 * DeleteReportUseCase
 *
 * 通報削除（論理削除）のユースケース
 */
class DeleteReportUseCase {
  constructor(private repository: IReportRepository) {}

  async execute(id: string): Promise<boolean> {
    const reportId = ReportId.create(id);
    return await this.repository.softDelete(reportId);
  }
}

export default DeleteReportUseCase;
