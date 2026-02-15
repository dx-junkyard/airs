import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import AnimalType from '@/server/domain/value-objects/AnimalType';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import ReportMapper from '@/server/infrastructure/mappers/ReportMapper';

/**
 * FilterReportsByAnimalTypeUseCase
 *
 * 獣種で通報をフィルターするユースケース
 */
class FilterReportsByAnimalTypeUseCase {
  constructor(private repository: IReportRepository) {}

  async execute(animalType: string): Promise<ReportDto[]> {
    const type = AnimalType.create(animalType);
    const reports = await this.repository.filterByAnimalType(type);

    return reports.map((report) => ReportMapper.toDto(report));
  }
}

export default FilterReportsByAnimalTypeUseCase;
