import EnableDataResetUseCase from './EnableDataResetUseCase';
import type { IAdminPasswordRepository } from '@/server/domain/repositories/IAdminPasswordRepository';

describe('EnableDataResetUseCase', () => {
  const mockRepository: IAdminPasswordRepository = {
    create: vi.fn().mockResolvedValue(undefined),
    findLatest: vi.fn(),
    findLatestInfo: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('4文字の英大文字+数字のパスワードを返す', async () => {
    const useCase = new EnableDataResetUseCase(mockRepository);
    const password = await useCase.execute('staff-1');

    expect(password).toMatch(/^[A-Z0-9]{4}$/);
  });

  it('ハッシュ化されたパスワードをリポジトリに保存する', async () => {
    const useCase = new EnableDataResetUseCase(mockRepository);
    await useCase.execute('staff-1');

    expect(mockRepository.create).toHaveBeenCalledTimes(1);
    const [hashedPassword, staffId] = (mockRepository.create as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(staffId).toBe('staff-1');
    // ハッシュはSHA-256の64文字hex
    expect(hashedPassword).toMatch(/^[0-9a-f]{64}$/);
  });

  it('返却されたパスワードとリポジトリに保存されたハッシュが対応する', async () => {
    const useCase = new EnableDataResetUseCase(mockRepository);
    const password = await useCase.execute('staff-1');

    const [storedHash] = (mockRepository.create as ReturnType<typeof vi.fn>).mock.calls[0];

    // 同じパスワードをハッシュして比較
    const crypto = await import('crypto');
    const expectedHash = crypto.createHash('sha256').update(password).digest('hex');
    expect(storedHash).toBe(expectedHash);
  });
});
