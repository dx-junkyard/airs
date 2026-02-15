import ProcessBulkImportUseCase from './ProcessBulkImportUseCase';
import type { IBulkActionRepository } from '@/server/domain/repositories/IBulkActionRepository';
import type { IDataResetRepository } from '@/server/domain/repositories/IDataResetRepository';
import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import type { IEventClusteringRepository } from '@/server/domain/repositories/IEventClusteringRepository';
import type { ISystemSettingRepository } from '@/server/domain/repositories/ISystemSettingRepository';

const CSV_HEADER = '獣種,目撃日,目撃時刻,緯度,経度,住所,画像URL,説明文,電話番号';
const CSV_DATA = 'サル,2024-01-15,10:30,35.6762,139.6503,東京都新宿区,,,';
const VALID_CSV = `${CSV_HEADER}\n${CSV_DATA}`;

function createMockBulkActionRepository(): IBulkActionRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue({
      id: 'ba-1',
      actionKey: 'csv-import',
      status: 'processing',
      fileUrl: 'https://example.com/test.csv',
      staffId: null,
      totalCount: 0,
      successCount: 0,
      errorCount: 0,
      result: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findLatestByActionKey: vi.fn(),
    findRecent: vi.fn(),
    updateStatus: vi.fn().mockImplementation((_id, data) =>
      Promise.resolve({
        id: 'ba-1',
        actionKey: 'csv-import',
        status: data.status ?? 'processing',
        fileUrl: 'https://example.com/test.csv',
        staffId: null,
        totalCount: data.totalCount ?? 0,
        successCount: data.successCount ?? 0,
        errorCount: data.errorCount ?? 0,
        result: data.result ?? null,
        errorMessage: data.errorMessage ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ),
  };
}

function createMockDataResetRepository(): IDataResetRepository {
  return {
    softDeleteAll: vi.fn().mockResolvedValue({
      reportsCount: 5,
      eventsCount: 2,
      eventReportsCount: 3,
    }),
  };
}

function createMockReportRepository(): IReportRepository {
  return {
    findAll: vi.fn(),
    findAllIncludingDeleted: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn().mockResolvedValue([
      {
        id: 'r1',
        animalType: 'monkey',
        latitude: 35.6762,
        longitude: 139.6503,
        hasOnlyDate: false,
        createdAt: new Date('2024-01-15T10:30:00+09:00'),
      },
    ]),
    updateLocations: vi.fn().mockResolvedValue(undefined),
    save: vi.fn(),
    softDelete: vi.fn(),
    filterByStatus: vi.fn(),
    filterByAnimalType: vi.fn(),
    search: vi.fn(),
    countByArea: vi.fn(),
    findWithFilters: vi.fn(),
  } as IReportRepository;
}

function createMockClusteringRepository(): IEventClusteringRepository {
  return {
    findMatchingEvent: vi.fn(),
    findMatchingPendingReport: vi.fn(),
    isWithinDistance: vi.fn().mockResolvedValue(false),
    createEventWithReports: vi.fn(),
    addReportToEvent: vi.fn(),
    getPendingReportIds: vi.fn(),
    findEventIdByReportId: vi.fn(),
    updateEventStaffId: vi.fn(),
  };
}

function createMockSettingRepository(): ISystemSettingRepository {
  return {
    findLatest: vi.fn().mockResolvedValue({
      eventClusteringRadiusMeters: 500,
      eventClusteringTimeMinutes: 60,
    }),
    create: vi.fn(),
  };
}

// グローバルfetchをモック
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('ProcessBulkImportUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(VALID_CSV),
    });
  });

  it('正常フロー: processing → completed', async () => {
    const bulkActionRepo = createMockBulkActionRepository();

    const useCase = new ProcessBulkImportUseCase(
      bulkActionRepo,
      createMockDataResetRepository(),
      createMockReportRepository(),
      createMockClusteringRepository(),
      createMockSettingRepository()
    );

    await useCase.execute('ba-1', false);

    // processing に更新
    expect(bulkActionRepo.updateStatus).toHaveBeenCalledWith('ba-1', {
      status: 'processing',
    });

    // completed に更新（最後の呼び出し）
    const lastCall = (bulkActionRepo.updateStatus as ReturnType<typeof vi.fn>).mock.calls.at(-1);
    expect(lastCall![1].status).toBe('completed');
  });

  it('resetBeforeImport=true の場合、softDeleteAllが呼ばれる', async () => {
    const dataResetRepo = createMockDataResetRepository();

    const useCase = new ProcessBulkImportUseCase(
      createMockBulkActionRepository(),
      dataResetRepo,
      createMockReportRepository(),
      createMockClusteringRepository(),
      createMockSettingRepository()
    );

    await useCase.execute('ba-1', true);

    expect(dataResetRepo.softDeleteAll).toHaveBeenCalledTimes(1);
  });

  it('resetBeforeImport=false の場合、softDeleteAllは呼ばれない', async () => {
    const dataResetRepo = createMockDataResetRepository();

    const useCase = new ProcessBulkImportUseCase(
      createMockBulkActionRepository(),
      dataResetRepo,
      createMockReportRepository(),
      createMockClusteringRepository(),
      createMockSettingRepository()
    );

    await useCase.execute('ba-1', false);

    expect(dataResetRepo.softDeleteAll).not.toHaveBeenCalled();
  });

  it('BulkActionが見つからない場合、failed状態に更新される', async () => {
    const bulkActionRepo = createMockBulkActionRepository();
    (bulkActionRepo.findById as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(null)   // execute内のfindById → null
      .mockResolvedValueOnce({       // catch内のfindById → processing
        id: 'ba-1',
        status: 'processing',
      });

    const useCase = new ProcessBulkImportUseCase(
      bulkActionRepo,
      createMockDataResetRepository(),
      createMockReportRepository(),
      createMockClusteringRepository(),
      createMockSettingRepository()
    );

    await useCase.execute('ba-1', false);

    const failedCall = (bulkActionRepo.updateStatus as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => call[1].status === 'failed'
    );
    expect(failedCall).toBeDefined();
    expect(failedCall![1].errorMessage).toContain('BulkAction not found');
  });

  it('CSVファイル取得失敗時、failed状態に更新される', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    const bulkActionRepo = createMockBulkActionRepository();

    const useCase = new ProcessBulkImportUseCase(
      bulkActionRepo,
      createMockDataResetRepository(),
      createMockReportRepository(),
      createMockClusteringRepository(),
      createMockSettingRepository()
    );

    await useCase.execute('ba-1', false);

    const failedCall = (bulkActionRepo.updateStatus as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => call[1].status === 'failed'
    );
    expect(failedCall).toBeDefined();
    expect(failedCall![1].errorMessage).toContain('CSVファイルの取得に失敗');
  });

  it('キャンセル済み（status != processing）の場合、completedに更新しない', async () => {
    const bulkActionRepo = createMockBulkActionRepository();
    // 完了前のfindByIdで cancelled状態を返す
    (bulkActionRepo.findById as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        id: 'ba-1',
        status: 'processing',
        fileUrl: 'https://example.com/test.csv',
      })
      .mockResolvedValueOnce({
        id: 'ba-1',
        status: 'cancelled',  // キャンセルされた
      });

    const useCase = new ProcessBulkImportUseCase(
      bulkActionRepo,
      createMockDataResetRepository(),
      createMockReportRepository(),
      createMockClusteringRepository(),
      createMockSettingRepository()
    );

    await useCase.execute('ba-1', false);

    const completedCall = (bulkActionRepo.updateStatus as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => call[1].status === 'completed'
    );
    expect(completedCall).toBeUndefined();
  });

  it('進捗コールバックでBulkActionが更新される', async () => {
    const bulkActionRepo = createMockBulkActionRepository();

    const useCase = new ProcessBulkImportUseCase(
      bulkActionRepo,
      createMockDataResetRepository(),
      createMockReportRepository(),
      createMockClusteringRepository(),
      createMockSettingRepository()
    );

    await useCase.execute('ba-1', false);

    // updateStatusが進捗報告で呼ばれている（processing + progress updates + completed）
    expect(
      (bulkActionRepo.updateStatus as ReturnType<typeof vi.fn>).mock.calls.length
    ).toBeGreaterThanOrEqual(2);
  });
});
