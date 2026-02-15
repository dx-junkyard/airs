import PrismaReportRepository from '@/server/infrastructure/repositories/PrismaReportRepository';
import VercelBlobImageRepository from '@/server/infrastructure/repositories/VercelBlobImageRepository';
import GcsImageRepository from '@/server/infrastructure/repositories/GcsImageRepository';
import PrismaEventClusteringRepository from '@/server/infrastructure/repositories/PrismaEventClusteringRepository';
import PrismaStaffRepository from '@/server/infrastructure/repositories/PrismaStaffRepository';
import PrismaStaffLocationRepository from '@/server/infrastructure/repositories/PrismaStaffLocationRepository';
import PrismaLineSessionRepository from '@/server/infrastructure/repositories/PrismaLineSessionRepository';
import PrismaSystemSettingRepository from '@/server/infrastructure/repositories/PrismaSystemSettingRepository';
import PrismaFacilityRepository from '@/server/infrastructure/repositories/PrismaFacilityRepository';
import PrismaAdminPasswordRepository from '@/server/infrastructure/repositories/PrismaAdminPasswordRepository';
import PrismaDataResetRepository from '@/server/infrastructure/repositories/PrismaDataResetRepository';
import PrismaBulkActionRepository from '@/server/infrastructure/repositories/PrismaBulkActionRepository';
import NominatimGeoRepository from '@/server/infrastructure/repositories/NominatimGeoRepository';
import YahooGeoRepository from '@/server/infrastructure/repositories/YahooGeoRepository';
import ReportRegistrationService from '@/server/application/services/ReportRegistrationService';
import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import type { IImageRepository } from '@/server/domain/repositories/IImageRepository';
import type { IEventClusteringRepository } from '@/server/domain/repositories/IEventClusteringRepository';
import type { IStaffRepository } from '@/server/domain/repositories/IStaffRepository';
import type { IStaffLocationRepository } from '@/server/domain/repositories/IStaffLocationRepository';
import type { IFacilityRepository } from '@/server/domain/repositories/IFacilityRepository';
import type { ILineSessionRepository } from '@/server/domain/repositories/ILineSessionRepository';
import type { IGeoRepository } from '@/server/domain/repositories/IGeoRepository';
import type { ISystemSettingRepository } from '@/server/domain/repositories/ISystemSettingRepository';
import type { IAdminPasswordRepository } from '@/server/domain/repositories/IAdminPasswordRepository';
import type { IDataResetRepository } from '@/server/domain/repositories/IDataResetRepository';
import type { IBulkActionRepository } from '@/server/domain/repositories/IBulkActionRepository';

/**
 * DIContainer
 *
 * Dependency Injection Container（依存性注入コンテナ）
 * Singletonパターンでリポジトリのインスタンスを管理
 */
class DIContainer {
  private static reportRepository: IReportRepository | null = null;
  private static imageRepository: IImageRepository | null = null;
  private static eventClusteringRepository: IEventClusteringRepository | null =
    null;
  private static staffRepository: IStaffRepository | null = null;
  private static staffLocationRepository: IStaffLocationRepository | null =
    null;
  private static facilityRepository: IFacilityRepository | null = null;
  private static lineSessionRepository: ILineSessionRepository | null = null;
  private static geoRepository: IGeoRepository | null = null;
  private static systemSettingRepository: ISystemSettingRepository | null =
    null;
  private static adminPasswordRepository: IAdminPasswordRepository | null =
    null;
  private static dataResetRepository: IDataResetRepository | null = null;
  private static bulkActionRepository: IBulkActionRepository | null = null;

  /**
   * ReportRepositoryのインスタンスを取得
   * 初回呼び出し時にインスタンスを生成し、以降は同じインスタンスを返す
   */
  static getReportRepository(): IReportRepository {
    if (!this.reportRepository) {
      this.reportRepository = new PrismaReportRepository();
    }
    return this.reportRepository;
  }

  /**
   * ImageRepositoryのインスタンスを取得
   * 初回呼び出し時にインスタンスを生成し、以降は同じインスタンスを返す
   */
  static getImageRepository(): IImageRepository {
    if (!this.imageRepository) {
      const provider = process.env.IMAGE_STORAGE_PROVIDER ?? 'vercel-blob';
      this.imageRepository =
        provider === 'gcs'
          ? new GcsImageRepository()
          : new VercelBlobImageRepository();
    }
    return this.imageRepository;
  }

  /**
   * EventClusteringRepositoryのインスタンスを取得
   * 初回呼び出し時にインスタンスを生成し、以降は同じインスタンスを返す
   */
  static getEventClusteringRepository(): IEventClusteringRepository {
    if (!this.eventClusteringRepository) {
      this.eventClusteringRepository = new PrismaEventClusteringRepository();
    }
    return this.eventClusteringRepository;
  }

  /**
   * StaffRepositoryのインスタンスを取得
   * 初回呼び出し時にインスタンスを生成し、以降は同じインスタンスを返す
   */
  static getStaffRepository(): IStaffRepository {
    if (!this.staffRepository) {
      this.staffRepository = new PrismaStaffRepository();
    }
    return this.staffRepository;
  }

  /**
   * StaffLocationRepositoryのインスタンスを取得
   * 初回呼び出し時にインスタンスを生成し、以降は同じインスタンスを返す
   */
  static getStaffLocationRepository(): IStaffLocationRepository {
    if (!this.staffLocationRepository) {
      this.staffLocationRepository = new PrismaStaffLocationRepository();
    }
    return this.staffLocationRepository;
  }

  /**
   * FacilityRepositoryのインスタンスを取得
   * 初回呼び出し時にインスタンスを生成し、以降は同じインスタンスを返す
   */
  static getFacilityRepository(): IFacilityRepository {
    if (!this.facilityRepository) {
      this.facilityRepository = new PrismaFacilityRepository();
    }
    return this.facilityRepository;
  }

  /**
   * LineSessionRepositoryのインスタンスを取得
   * 初回呼び出し時にインスタンスを生成し、以降は同じインスタンスを返す
   */
  static getLineSessionRepository(): ILineSessionRepository {
    if (!this.lineSessionRepository) {
      this.lineSessionRepository = new PrismaLineSessionRepository();
    }
    return this.lineSessionRepository;
  }

  /**
   * GeoRepositoryのインスタンスを取得
   * 初回呼び出し時にインスタンスを生成し、以降は同じインスタンスを返す
   */
  static getGeoRepository(): IGeoRepository {
    if (!this.geoRepository) {
      const provider = (process.env.GEO_PROVIDER ?? 'yahoo').toLowerCase();
      if (provider === 'nominatim') {
        this.geoRepository = new NominatimGeoRepository();
      } else if (provider === 'yahoo') {
        this.geoRepository = new YahooGeoRepository();
      } else {
        throw new Error(`未対応のGEO_PROVIDERです: ${provider}`);
      }
    }
    return this.geoRepository;
  }

  /**
   * SystemSettingRepositoryのインスタンスを取得
   * 初回呼び出し時にインスタンスを生成し、以降は同じインスタンスを返す
   */
  static getSystemSettingRepository(): ISystemSettingRepository {
    if (!this.systemSettingRepository) {
      this.systemSettingRepository = new PrismaSystemSettingRepository();
    }
    return this.systemSettingRepository;
  }

  /**
   * AdminPasswordRepositoryのインスタンスを取得
   */
  static getAdminPasswordRepository(): IAdminPasswordRepository {
    if (!this.adminPasswordRepository) {
      this.adminPasswordRepository = new PrismaAdminPasswordRepository();
    }
    return this.adminPasswordRepository;
  }

  /**
   * DataResetRepositoryのインスタンスを取得
   */
  static getDataResetRepository(): IDataResetRepository {
    if (!this.dataResetRepository) {
      this.dataResetRepository = new PrismaDataResetRepository();
    }
    return this.dataResetRepository;
  }

  /**
   * BulkActionRepositoryのインスタンスを取得
   */
  static getBulkActionRepository(): IBulkActionRepository {
    if (!this.bulkActionRepository) {
      this.bulkActionRepository = new PrismaBulkActionRepository();
    }
    return this.bulkActionRepository;
  }

  /**
   * ReportRegistrationServiceのインスタンスを生成
   * 通報登録の共通ワークフロー（作成・クラスタリング・自動アサイン）を統合
   */
  static getReportRegistrationService(): ReportRegistrationService {
    return new ReportRegistrationService(
      this.getReportRepository(),
      this.getEventClusteringRepository(),
      this.getStaffLocationRepository(),
      this.getSystemSettingRepository()
    );
  }

  /**
   * テスト用にすべてのインスタンスをリセット
   * ユニットテスト間でクリーンな状態を保つために使用
   */
  static reset(): void {
    this.reportRepository = null;
    this.imageRepository = null;
    this.eventClusteringRepository = null;
    this.staffRepository = null;
    this.staffLocationRepository = null;
    this.facilityRepository = null;
    this.lineSessionRepository = null;
    this.geoRepository = null;
    this.systemSettingRepository = null;
    this.adminPasswordRepository = null;
    this.dataResetRepository = null;
    this.bulkActionRepository = null;
  }
}

export default DIContainer;
