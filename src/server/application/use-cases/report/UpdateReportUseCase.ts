import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import ReportId from '@/server/domain/models/ReportId';
import ReportStatus from '@/server/domain/value-objects/ReportStatus';
import type { UpdateReportDto } from '@/server/application/dtos/UpdateReportDto';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import ReportMapper from '@/server/infrastructure/mappers/ReportMapper';

/**
 * UpdateReportUseCase
 *
 * 通報更新のユースケース
 */
class UpdateReportUseCase {
  constructor(private repository: IReportRepository) {}

  async execute(id: string, dto: UpdateReportDto): Promise<ReportDto> {
    const reportId = ReportId.create(id);
    const report = await this.repository.findById(reportId);

    if (!report) {
      throw new Error('通報が見つかりません');
    }

    // ステータス更新の場合は専用メソッドを使用
    if (dto.status) {
      const newStatus = ReportStatus.create(dto.status);
      report.updateStatus(newStatus);
    }

    // その他のフィールドを更新
    const updateParams = ReportMapper.toUpdateParams(dto);
    report.update(updateParams);

    // 保存
    const updatedReport = await this.repository.save(report);

    return ReportMapper.toDto(updatedReport);
  }
}

export default UpdateReportUseCase;
