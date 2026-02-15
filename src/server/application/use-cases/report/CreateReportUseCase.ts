import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import type { CreateReportDto } from '@/server/application/dtos/CreateReportDto';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import ReportMapper from '@/server/infrastructure/mappers/ReportMapper';

/**
 * CreateReportUseCase
 *
 * 新規通報作成のユースケース
 */
class CreateReportUseCase {
  constructor(private repository: IReportRepository) {}

  async execute(dto: CreateReportDto): Promise<ReportDto> {
    // Repository側でDTOからReportを作成し、IDを自動発行
    const savedReport = await this.repository.create(dto);

    // DTOに変換して返却
    return ReportMapper.toDto(savedReport);
  }
}

export default CreateReportUseCase;
