import BulkImportReportsUseCase from './BulkImportReportsUseCase';
import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import type { IEventClusteringRepository } from '@/server/domain/repositories/IEventClusteringRepository';
import type { ISystemSettingRepository } from '@/server/domain/repositories/ISystemSettingRepository';

const CSV_HEADER = '獣種,目撃日,目撃時刻,緯度,経度,住所,画像URL,説明文,電話番号';

function buildCsv(...dataRows: string[]): string {
  return [CSV_HEADER, ...dataRows].join('\n');
}

function createMockReportRepository(
  overrides: Partial<IReportRepository> = {}
): IReportRepository {
  return {
    findAll: vi.fn(),
    findAllIncludingDeleted: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn().mockResolvedValue([]),
    updateLocations: vi.fn().mockResolvedValue(undefined),
    save: vi.fn(),
    softDelete: vi.fn(),
    filterByStatus: vi.fn(),
    filterByAnimalType: vi.fn(),
    search: vi.fn(),
    countByArea: vi.fn(),
    findWithFilters: vi.fn(),
    ...overrides,
  } as IReportRepository;
}

function createMockClusteringRepository(
  overrides: Partial<IEventClusteringRepository> = {}
): IEventClusteringRepository {
  return {
    findMatchingEvent: vi.fn(),
    findMatchingPendingReport: vi.fn(),
    isWithinDistance: vi.fn().mockResolvedValue(true),
    createEventWithReports: vi.fn().mockResolvedValue('event-1'),
    addReportToEvent: vi.fn().mockResolvedValue(undefined),
    getPendingReportIds: vi.fn(),
    findEventIdByReportId: vi.fn(),
    updateEventStaffId: vi.fn(),
    ...overrides,
  };
}

function createMockSettingRepository(
  overrides: Partial<ISystemSettingRepository> = {}
): ISystemSettingRepository {
  return {
    findLatest: vi.fn().mockResolvedValue({
      eventClusteringRadiusMeters: 500,
      eventClusteringTimeMinutes: 60,
    }),
    create: vi.fn(),
    ...overrides,
  };
}

describe('BulkImportReportsUseCase', () => {
  describe('バリデーション', () => {
    it('有効な行を正常にインポートする', async () => {
      const insertedReports = [
        {
          id: 'r1',
          animalType: 'monkey',
          latitude: 35.6762,
          longitude: 139.6503,
          hasOnlyDate: false,
          createdAt: new Date('2024-01-15T10:30:00+09:00'),
        },
      ];
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue(insertedReports),
      });

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,10:30,35.6762,139.6503,東京都新宿区,,目撃情報,'
      );
      const result = await useCase.execute(csv);

      expect(result.phase).toBe('done');
      expect(result.importTotal).toBe(1);
      expect(result.importSuccess).toBe(1);
      expect(result.importError).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(reportRepo.createMany).toHaveBeenCalledTimes(1);
    });

    it('獣種が空の行をエラーとして報告する', async () => {
      const reportRepo = createMockReportRepository();

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        ',2024-01-15,10:30,35.6762,139.6503,東京都新宿区,,,'
      );
      const result = await useCase.execute(csv);

      expect(result.importError).toBe(1);
      expect(result.errors[0].row).toBe(2);
      expect(result.errors[0].message).toContain('獣種は必須');
    });

    it('不明な獣種をエラーとして報告する', async () => {
      const reportRepo = createMockReportRepository();

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'ドラゴン,2024-01-15,10:30,35.6762,139.6503,東京都新宿区,,,'
      );
      const result = await useCase.execute(csv);

      expect(result.importError).toBe(1);
      expect(result.errors[0].message).toContain('不明な獣種');
    });

    it('目撃日が空の行をエラーとして報告する', async () => {
      const reportRepo = createMockReportRepository();

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv('サル,,10:30,35.6762,139.6503,東京都新宿区,,,');
      const result = await useCase.execute(csv);

      expect(result.importError).toBe(1);
      expect(result.errors[0].message).toContain('目撃日は必須');
    });

    it('不正な日付形式をエラーとして報告する', async () => {
      const reportRepo = createMockReportRepository();

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,invalid-date,10:30,35.6762,139.6503,東京都新宿区,,,'
      );
      const result = await useCase.execute(csv);

      expect(result.importError).toBe(1);
      expect(result.errors[0].message).toContain('不正な日時形式');
    });

    it('緯度が範囲外の場合エラーとして報告する', async () => {
      const reportRepo = createMockReportRepository();

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,10:30,91.0,139.6503,東京都新宿区,,,'
      );
      const result = await useCase.execute(csv);

      expect(result.importError).toBe(1);
      expect(result.errors[0].message).toContain('緯度の範囲が不正');
    });

    it('経度が範囲外の場合エラーとして報告する', async () => {
      const reportRepo = createMockReportRepository();

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,10:30,35.6762,181.0,東京都新宿区,,,'
      );
      const result = await useCase.execute(csv);

      expect(result.importError).toBe(1);
      expect(result.errors[0].message).toContain('経度の範囲が不正');
    });

    it('住所が空の行をエラーとして報告する', async () => {
      const reportRepo = createMockReportRepository();

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv('サル,2024-01-15,10:30,35.6762,139.6503,,,,');
      const result = await useCase.execute(csv);

      expect(result.importError).toBe(1);
      expect(result.errors[0].message).toContain('住所は必須');
    });

    it('画像URLがHTTPの場合エラーとして報告する', async () => {
      const reportRepo = createMockReportRepository();

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,10:30,35.6762,139.6503,東京都新宿区,http://example.com/img.jpg,,'
      );
      const result = await useCase.execute(csv);

      expect(result.importError).toBe(1);
      expect(result.errors[0].message).toContain('HTTPS');
    });

    it('画像URLがHTTPSなら正常に処理する', async () => {
      const insertedReports = [
        {
          id: 'r1',
          animalType: 'monkey',
          latitude: 35.6762,
          longitude: 139.6503,
          hasOnlyDate: false,
          createdAt: new Date('2024-01-15T10:30:00+09:00'),
        },
      ];
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue(insertedReports),
      });

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,10:30,35.6762,139.6503,東京都新宿区,https://example.com/img.jpg,,'
      );
      const result = await useCase.execute(csv);

      expect(result.importError).toBe(0);
    });

    it('有効行とエラー行が混在する場合、それぞれ正しくカウントする', async () => {
      const insertedReports = [
        {
          id: 'r1',
          animalType: 'monkey',
          latitude: 35.6762,
          longitude: 139.6503,
          hasOnlyDate: false,
          createdAt: new Date('2024-01-15T10:30:00+09:00'),
        },
      ];
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue(insertedReports),
      });

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,10:30,35.6762,139.6503,東京都新宿区,,,',
        ',2024-01-15,,35.0,139.0,京都,,,'    // 獣種なし
      );
      const result = await useCase.execute(csv);

      expect(result.importTotal).toBe(2);
      expect(result.importSuccess).toBe(1);
      expect(result.importError).toBe(1);
    });

    it('エラー行の行番号はヘッダー分を加算した値になる', async () => {
      const reportRepo = createMockReportRepository();

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,10:30,35.6762,139.6503,東京都新宿区,,,', // row 2: OK
        ',2024-01-15,,35.0,139.0,京都,,,',                        // row 3: error
        'サル,2024-01-15,,35.0,139.0,大阪,,,',                    // row 4: OK
      );

      const insertedReports = [
        { id: 'r1', animalType: 'monkey', latitude: 35.6762, longitude: 139.6503, hasOnlyDate: false, createdAt: new Date() },
        { id: 'r2', animalType: 'monkey', latitude: 35.0, longitude: 139.0, hasOnlyDate: true, createdAt: new Date() },
      ];
      (reportRepo.createMany as ReturnType<typeof vi.fn>).mockResolvedValue(insertedReports);

      const result = await useCase.execute(csv);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(3); // header=1, data starts at 2
    });
  });

  describe('DTO変換', () => {
    it('目撃時刻ありの場合、hasOnlyDate=false でDTOが生成される', async () => {
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue([
          { id: 'r1', animalType: 'monkey', latitude: 35.6762, longitude: 139.6503, hasOnlyDate: false, createdAt: new Date() },
        ]),
      });

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,10:30,35.6762,139.6503,東京都新宿区,,,'
      );
      await useCase.execute(csv);

      const calledWith = (reportRepo.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(calledWith[0].hasOnlyDate).toBe(false);
      expect(calledWith[0].createdAt).toContain('2024-01-15');
    });

    it('目撃時刻なしの場合、hasOnlyDate=true でDTOが生成される', async () => {
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue([
          { id: 'r1', animalType: 'monkey', latitude: 35.6762, longitude: 139.6503, hasOnlyDate: true, createdAt: new Date() },
        ]),
      });

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,,35.6762,139.6503,東京都新宿区,,,'
      );
      await useCase.execute(csv);

      const calledWith = (reportRepo.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(calledWith[0].hasOnlyDate).toBe(true);
    });
  });

  describe('クラスタリング', () => {
    it('同じ獣種・時間・距離の通報がイベントにクラスタリングされる', async () => {
      const now = new Date('2024-01-15T10:00:00+09:00');
      const insertedReports = [
        { id: 'r1', animalType: 'monkey', latitude: 35.676, longitude: 139.650, hasOnlyDate: false, createdAt: now },
        { id: 'r2', animalType: 'monkey', latitude: 35.677, longitude: 139.651, hasOnlyDate: false, createdAt: new Date(now.getTime() + 30 * 60 * 1000) },
      ];
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue(insertedReports),
      });
      const clusterRepo = createMockClusteringRepository({
        isWithinDistance: vi.fn().mockResolvedValue(true),
      });

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        clusterRepo,
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,10:00,35.676,139.650,東京都,,,',
        'サル,2024-01-15,10:30,35.677,139.651,東京都,,,',
      );
      const result = await useCase.execute(csv);

      expect(result.eventsCreated).toBe(1);
      expect(clusterRepo.createEventWithReports).toHaveBeenCalledWith('r1', 'r2');
    });

    it('異なる獣種の通報はクラスタリングされない', async () => {
      const now = new Date('2024-01-15T10:00:00+09:00');
      const insertedReports = [
        { id: 'r1', animalType: 'monkey', latitude: 35.676, longitude: 139.650, hasOnlyDate: false, createdAt: now },
        { id: 'r2', animalType: 'deer', latitude: 35.677, longitude: 139.651, hasOnlyDate: false, createdAt: now },
      ];
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue(insertedReports),
      });

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,10:00,35.676,139.650,東京都,,,',
        'シカ,2024-01-15,10:00,35.677,139.651,東京都,,,',
      );
      const result = await useCase.execute(csv);

      expect(result.eventsCreated).toBe(0);
    });

    it('時間差が閾値を超える通報はクラスタリングされない', async () => {
      const now = new Date('2024-01-15T10:00:00+09:00');
      const insertedReports = [
        { id: 'r1', animalType: 'monkey', latitude: 35.676, longitude: 139.650, hasOnlyDate: false, createdAt: now },
        { id: 'r2', animalType: 'monkey', latitude: 35.677, longitude: 139.651, hasOnlyDate: false, createdAt: new Date(now.getTime() + 120 * 60 * 1000) },
      ];
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue(insertedReports),
      });

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,10:00,35.676,139.650,東京都,,,',
        'サル,2024-01-15,12:00,35.677,139.651,東京都,,,',
      );
      const result = await useCase.execute(csv);

      expect(result.eventsCreated).toBe(0);
    });

    it('距離が閾値を超える通報はクラスタリングされない', async () => {
      const now = new Date('2024-01-15T10:00:00+09:00');
      const insertedReports = [
        { id: 'r1', animalType: 'monkey', latitude: 35.676, longitude: 139.650, hasOnlyDate: false, createdAt: now },
        { id: 'r2', animalType: 'monkey', latitude: 35.677, longitude: 139.651, hasOnlyDate: false, createdAt: new Date(now.getTime() + 30 * 60 * 1000) },
      ];
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue(insertedReports),
      });
      const clusterRepo = createMockClusteringRepository({
        isWithinDistance: vi.fn().mockResolvedValue(false),
      });

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        clusterRepo,
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,10:00,35.676,139.650,東京都,,,',
        'サル,2024-01-15,10:30,35.677,139.651,東京都,,,',
      );
      const result = await useCase.execute(csv);

      expect(result.eventsCreated).toBe(0);
    });

    it('hasOnlyDate の通報はクラスタリング対象から除外される', async () => {
      const now = new Date('2024-01-15T00:00:00+09:00');
      const insertedReports = [
        { id: 'r1', animalType: 'monkey', latitude: 35.676, longitude: 139.650, hasOnlyDate: true, createdAt: now },
        { id: 'r2', animalType: 'monkey', latitude: 35.677, longitude: 139.651, hasOnlyDate: true, createdAt: now },
      ];
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue(insertedReports),
      });
      const clusterRepo = createMockClusteringRepository();

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        clusterRepo,
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,,35.676,139.650,東京都,,,',
        'サル,2024-01-15,,35.677,139.651,東京都,,,',
      );
      const result = await useCase.execute(csv);

      expect(result.eventsCreated).toBe(0);
      // isWithinDistance は呼ばれない（クラスタリング候補が0件なので）
      expect(clusterRepo.isWithinDistance).not.toHaveBeenCalled();
    });

    it('3件以上のクラスタでは3件目以降がaddReportToEventで追加される', async () => {
      const now = new Date('2024-01-15T10:00:00+09:00');
      const insertedReports = [
        { id: 'r1', animalType: 'monkey', latitude: 35.676, longitude: 139.650, hasOnlyDate: false, createdAt: now },
        { id: 'r2', animalType: 'monkey', latitude: 35.677, longitude: 139.651, hasOnlyDate: false, createdAt: new Date(now.getTime() + 10 * 60 * 1000) },
        { id: 'r3', animalType: 'monkey', latitude: 35.678, longitude: 139.652, hasOnlyDate: false, createdAt: new Date(now.getTime() + 20 * 60 * 1000) },
      ];
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue(insertedReports),
      });
      const clusterRepo = createMockClusteringRepository({
        isWithinDistance: vi.fn().mockResolvedValue(true),
        createEventWithReports: vi.fn().mockResolvedValue('event-1'),
      });

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        clusterRepo,
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,10:00,35.676,139.650,東京都,,,',
        'サル,2024-01-15,10:10,35.677,139.651,東京都,,,',
        'サル,2024-01-15,10:20,35.678,139.652,東京都,,,',
      );
      const result = await useCase.execute(csv);

      expect(result.eventsCreated).toBe(1);
      expect(clusterRepo.createEventWithReports).toHaveBeenCalledWith('r1', 'r2');
      expect(clusterRepo.addReportToEvent).toHaveBeenCalledWith('event-1', 'r3');
    });
  });

  describe('PostGIS location更新', () => {
    it('インポート成功後にupdateLocationsが呼ばれる', async () => {
      const insertedReports = [
        { id: 'r1', animalType: 'monkey', latitude: 35.676, longitude: 139.650, hasOnlyDate: false, createdAt: new Date() },
      ];
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue(insertedReports),
      });

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const csv = buildCsv(
        'サル,2024-01-15,10:00,35.676,139.650,東京都,,,'
      );
      await useCase.execute(csv);

      expect(reportRepo.updateLocations).toHaveBeenCalledWith(['r1']);
    });

    it('インポート成功0件の場合updateLocationsは呼ばれない', async () => {
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue([]),
      });

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      // 全行エラーになるCSV
      const csv = buildCsv(
        ',2024-01-15,,35.676,139.650,東京都,,,'
      );
      await useCase.execute(csv);

      expect(reportRepo.updateLocations).not.toHaveBeenCalled();
    });
  });

  describe('進捗コールバックとキャンセル', () => {
    it('進捗コールバックが呼ばれる', async () => {
      const insertedReports = [
        { id: 'r1', animalType: 'monkey', latitude: 35.676, longitude: 139.650, hasOnlyDate: false, createdAt: new Date() },
      ];
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue(insertedReports),
      });

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        createMockClusteringRepository(),
        createMockSettingRepository()
      );

      const onProgress = vi.fn().mockResolvedValue(true);

      const csv = buildCsv(
        'サル,2024-01-15,10:00,35.676,139.650,東京都,,,'
      );
      await useCase.execute(csv, onProgress);

      // importing + clustering 最終の少なくとも2回
      expect(onProgress).toHaveBeenCalled();
      expect(onProgress.mock.calls[0][0].phase).toBe('importing');
    });

    it('Phase1でキャンセルするとPhase2をスキップする', async () => {
      const insertedReports = [
        { id: 'r1', animalType: 'monkey', latitude: 35.676, longitude: 139.650, hasOnlyDate: false, createdAt: new Date() },
        { id: 'r2', animalType: 'monkey', latitude: 35.677, longitude: 139.651, hasOnlyDate: false, createdAt: new Date() },
      ];
      const reportRepo = createMockReportRepository({
        createMany: vi.fn().mockResolvedValue(insertedReports),
      });
      const clusterRepo = createMockClusteringRepository();

      const useCase = new BulkImportReportsUseCase(
        reportRepo,
        clusterRepo,
        createMockSettingRepository()
      );

      // Phase1の進捗でfalseを返してキャンセル
      const onProgress = vi.fn().mockResolvedValue(false);

      const csv = buildCsv(
        'サル,2024-01-15,10:00,35.676,139.650,東京都,,,',
        'サル,2024-01-15,10:10,35.677,139.651,東京都,,,',
      );
      const result = await useCase.execute(csv, onProgress);

      expect(result.phase).toBe('done');
      expect(result.eventsCreated).toBe(0);
      // クラスタリングのDB呼び出しは行われない
      expect(clusterRepo.isWithinDistance).not.toHaveBeenCalled();
    });
  });
});
