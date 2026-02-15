import ExecuteDataResetUseCase from './ExecuteDataResetUseCase';
import PasswordService from '@/server/domain/services/PasswordService';
import type { IAdminPasswordRepository } from '@/server/domain/repositories/IAdminPasswordRepository';
import type { IDataResetRepository } from '@/server/domain/repositories/IDataResetRepository';

describe('ExecuteDataResetUseCase', () => {
  const passwordService = new PasswordService();

  const mockAdminPasswordRepository: IAdminPasswordRepository = {
    create: vi.fn(),
    findLatest: vi.fn(),
    findLatestInfo: vi.fn(),
  };

  const mockDataResetRepository: IDataResetRepository = {
    softDeleteAll: vi.fn().mockResolvedValue({
      reportsCount: 10,
      eventsCount: 3,
      eventReportsCount: 8,
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('正しいパスワードでデータリセットを実行できる', async () => {
    const password = 'AB12';
    const hashed = passwordService.hash(password);
    (mockAdminPasswordRepository.findLatest as ReturnType<typeof vi.fn>).mockResolvedValue(hashed);

    const useCase = new ExecuteDataResetUseCase(
      mockAdminPasswordRepository,
      mockDataResetRepository
    );
    const result = await useCase.execute(password);

    expect(result).toEqual({
      reportsCount: 10,
      eventsCount: 3,
      eventReportsCount: 8,
    });
    expect(mockDataResetRepository.softDeleteAll).toHaveBeenCalledTimes(1);
  });

  it('パスワードが有効化されていない場合エラーをスローする', async () => {
    (mockAdminPasswordRepository.findLatest as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const useCase = new ExecuteDataResetUseCase(
      mockAdminPasswordRepository,
      mockDataResetRepository
    );

    await expect(useCase.execute('AB12')).rejects.toThrow(
      'リセットが有効化されていません'
    );
    expect(mockDataResetRepository.softDeleteAll).not.toHaveBeenCalled();
  });

  it('パスワードが間違っている場合エラーをスローする', async () => {
    const hashed = passwordService.hash('AB12');
    (mockAdminPasswordRepository.findLatest as ReturnType<typeof vi.fn>).mockResolvedValue(hashed);

    const useCase = new ExecuteDataResetUseCase(
      mockAdminPasswordRepository,
      mockDataResetRepository
    );

    await expect(useCase.execute('WRONG')).rejects.toThrow(
      'パスワードが正しくありません'
    );
    expect(mockDataResetRepository.softDeleteAll).not.toHaveBeenCalled();
  });
});
