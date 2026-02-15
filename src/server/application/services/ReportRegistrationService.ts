import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import type { IEventClusteringRepository } from '@/server/domain/repositories/IEventClusteringRepository';
import type { IStaffLocationRepository } from '@/server/domain/repositories/IStaffLocationRepository';
import type { ISystemSettingRepository } from '@/server/domain/repositories/ISystemSettingRepository';
import type { CreateReportDto } from '@/server/application/dtos/CreateReportDto';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import CreateReportUseCase from '@/server/application/use-cases/report/CreateReportUseCase';
import UpdateReportUseCase from '@/server/application/use-cases/report/UpdateReportUseCase';
import AutoAssignStaffUseCase from '@/server/application/use-cases/staff-location/AutoAssignStaffUseCase';
import GetSystemSettingUseCase from '@/server/application/use-cases/system-setting/GetSystemSettingUseCase';
import EventClusteringService from '@/server/domain/services/EventClusteringService';

/**
 * ReportRegistrationService
 *
 * 通報登録の共通ワークフローを統合するApplication Service。
 * Web UIとLINE両方の通報作成フローから利用される。
 *
 * 処理内容:
 * 1. 通報作成
 * 2. イベントクラスタリング（ベストエフォート）
 * 3. 担当者自動アサイン（ベストエフォート）+ Event staffId更新
 */
class ReportRegistrationService {
  constructor(
    private reportRepository: IReportRepository,
    private eventClusteringRepository: IEventClusteringRepository,
    private staffLocationRepository: IStaffLocationRepository,
    private systemSettingRepository: ISystemSettingRepository
  ) {}

  async execute(dto: CreateReportDto): Promise<ReportDto> {
    // 1. 通報作成
    const createUseCase = new CreateReportUseCase(this.reportRepository);
    const result = await createUseCase.execute(dto);

    // 2. イベントクラスタリング（ベストエフォート）
    try {
      const setting = await new GetSystemSettingUseCase(
        this.systemSettingRepository
      ).execute();
      const clusteringService = new EventClusteringService(
        this.eventClusteringRepository,
        {
          distanceMeters: setting.value.eventClusteringRadiusMeters,
          timeMinutes: setting.value.eventClusteringTimeMinutes,
        }
      );
      await clusteringService.processNewReport(
        result.id,
        result.animalType,
        new Date(result.createdAt)
      );
    } catch (error) {
      console.error('Event clustering failed:', error);
    }

    // 3. 担当者自動アサイン（ベストエフォート）
    try {
      const autoAssignUseCase = new AutoAssignStaffUseCase(
        this.staffLocationRepository
      );
      const nearestStaffId = await autoAssignUseCase.execute(
        result.latitude,
        result.longitude
      );

      if (nearestStaffId) {
        const updateUseCase = new UpdateReportUseCase(this.reportRepository);
        await updateUseCase.execute(result.id, { staffId: nearestStaffId });
        result.staffId = nearestStaffId;

        // 関連EventのstaffIdも更新
        try {
          const eventId =
            await this.eventClusteringRepository.findEventIdByReportId(
              result.id
            );
          if (eventId) {
            await this.eventClusteringRepository.updateEventStaffId(
              eventId,
              nearestStaffId
            );
          }
        } catch (eventError) {
          console.error('Event staffId auto-assign failed:', eventError);
        }
      }
    } catch (error) {
      console.error('Staff auto-assign failed:', error);
    }

    return result;
  }
}

export default ReportRegistrationService;
