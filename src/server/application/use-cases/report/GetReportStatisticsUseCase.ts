import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import type { ReportStatisticsDto } from '@/server/application/dtos/ReportStatisticsDto';
import ReportMapper from '@/server/infrastructure/mappers/ReportMapper';
import StatisticsService from '@/server/domain/services/StatisticsService';
import { VALID_ANIMAL_TYPES } from '@/server/domain/constants/animalTypes';

/**
 * 統計取得のパラメータ
 */
export interface GetReportStatisticsParams {
  startDate?: Date;
  endDate?: Date;
}

/**
 * GetReportStatisticsUseCase
 *
 * 通報統計情報取得のユースケース
 */
class GetReportStatisticsUseCase {
  constructor(private repository: IReportRepository) {}

  async execute(params?: GetReportStatisticsParams): Promise<ReportStatisticsDto> {
    const { startDate, endDate } = params ?? {};

    // 通報を取得（日付範囲フィルター適用）
    const reports = await this.repository.findAll({ startDate, endDate });

    // ステータス別集計
    const statusCount = StatisticsService.countByKey(
      reports,
      (r) => r.status.value,
      ['waiting', 'completed']
    );

    // 獣種別集計
    const animalTypeCount = StatisticsService.countByKey(
      reports,
      (r) => r.animalType.value,
      [...VALID_ANIMAL_TYPES]
    );

    // エリア別集計（TOP 10）
    const areaRanking = await this.repository.countByArea({
      limit: 10,
      startDate,
      endDate,
    });

    // 統計DTOに変換
    return ReportMapper.toStatisticsDto(
      reports,
      statusCount,
      animalTypeCount,
      areaRanking
    );
  }
}

export default GetReportStatisticsUseCase;
