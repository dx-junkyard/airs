import Report from '@/server/domain/models/Report';
import ReportId from '@/server/domain/models/ReportId';
import Address from '@/server/domain/value-objects/Address';
import AnimalType from '@/server/domain/value-objects/AnimalType';
import ImageUrls from '@/server/domain/value-objects/ImageUrls';
import Location from '@/server/domain/value-objects/Location';
import PhoneNumber from '@/server/domain/value-objects/PhoneNumber';
import ReportStatus from '@/server/domain/value-objects/ReportStatus';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import type { UpdateReportDto } from '@/server/application/dtos/UpdateReportDto';
import type {
  AnimalTypeCountDto,
  AreaCountDto,
  HourlyAnimalDataDto,
  ReportStatisticsDto,
  StatusCountDto,
  TimeSeriesAnimalDataDto,
} from '@/server/application/dtos/ReportStatisticsDto';
import StatisticsService, {
  type CountResult,
} from '@/server/domain/services/StatisticsService';
import type { UpdateReportParams } from '@/server/domain/models/Report';

/**
 * ReportMapper
 *
 * Reportエンティティ ↔ DTO変換
 */
class ReportMapper {
  /**
   * Reportエンティティ → ReportDto
   */
  static toDto(report: Report): ReportDto {
    return {
      id: report.id.value,
      animalType: report.animalType.value,
      latitude: report.location.latitude,
      longitude: report.location.longitude,
      address: report.address.value,
      phoneNumber: report.phoneNumber?.value,
      images: [...report.imageUrls.images],
      description: report.description,
      status: report.status.value,
      staffId: report.staffId,
      staffName: report.staffName,
      areaKey: report.areaKey,
      areaRegionLabel: report.areaRegionLabel,
      areaChomeLabel: report.areaChomeLabel,
      eventId: report.eventId,
      eventReportCount: report.eventReportCount,
      hasOnlyDate: report.hasOnlyDate,
      createdAt: report.createdAt.toISOString(),
      deletedAt: report.deletedAt?.toISOString() ?? null,
      updatedAt: report.updatedAt.toISOString(),
    };
  }

  /**
   * UpdateReportDto → Report更新パラメータ
   */
  static toUpdateParams(dto: UpdateReportDto): UpdateReportParams {
    return {
      animalType: dto.animalType
        ? AnimalType.create(dto.animalType)
        : undefined,
      location:
        dto.latitude && dto.longitude
          ? Location.create(parseFloat(dto.latitude), parseFloat(dto.longitude))
          : undefined,
      address: dto.address ? Address.create(dto.address) : undefined,
      phoneNumber: dto.phoneNumber
        ? PhoneNumber.create(dto.phoneNumber)
        : undefined,
      imageUrls: dto.images ? ImageUrls.create(dto.images) : undefined,
      description: dto.description,
      staffId: dto.staffId,
    };
  }

  /**
   * Reports配列と集計結果 → ReportStatisticsDto
   */
  static toStatisticsDto(
    reports: Report[],
    statusCount: CountResult<string>,
    animalTypeCount: CountResult<string>,
    areaRanking: Array<{
      areaKey: string;
      regionLabel: string;
      chomeLabel: string;
      count: number;
    }> = []
  ): ReportStatisticsDto {
    // 時系列データを生成（日次集計）
    const timeSeriesData = StatisticsService.generateTimeSeriesData(
      reports,
      (r) => r.createdAt,
      'daily'
    );

    // 時系列獣種別データを生成（日次集計）
    const timeSeriesAnimalData = StatisticsService.generateTimeSeriesAnimalData(
      reports,
      (r) => r.createdAt,
      (r) => r.animalType.value,
      'daily'
    );

    // 時間帯別獣種データを生成（hasOnlyDateの通報は時刻情報がないため除外）
    const reportsWithTime = reports.filter((r) => !r.hasOnlyDate);
    const hourlyAnimalData = StatisticsService.generateHourlyAnimalData(
      reportsWithTime,
      (r) => r.createdAt,
      (r) => r.animalType.value
    );

    // 獣種別集計を動的に構築（animalType値をそのままキーとして使用）
    const animalTypeCountDto: AnimalTypeCountDto = { total: reports.length };
    for (const [key, value] of Object.entries(animalTypeCount)) {
      if (key !== 'total') {
        animalTypeCountDto[key] = value;
      }
    }

    return {
      statusCount: {
        waiting: statusCount['waiting'] ?? 0,
        completed: statusCount['completed'] ?? 0,
        total: reports.length,
      } as StatusCountDto,
      animalTypeCount: animalTypeCountDto,
      timeSeriesData: timeSeriesData.map((item) => ({
        date: item.date,
        count: item.count,
      })),
      timeSeriesAnimalData: timeSeriesAnimalData as TimeSeriesAnimalDataDto[],
      areaRanking: areaRanking.map((item) => ({
        areaKey: item.areaKey,
        regionLabel: item.regionLabel,
        chomeLabel: item.chomeLabel,
        count: item.count,
      })) as AreaCountDto[],
      hourlyAnimalData: hourlyAnimalData as HourlyAnimalDataDto[],
      lastUpdated: new Date().toISOString(),
    };
  }
}

export default ReportMapper;
