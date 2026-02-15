import { POST } from './route';
import PasswordService from '@/server/domain/services/PasswordService';

// --- mocks ---

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: 'staff-1' }),
  }),
}));

vi.mock('@/features/common/utils/isAdmin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/features/staff/utils/staffCookie', () => ({
  STAFF_COOKIE_NAME: 'staff',
}));

const mockFindLatest = vi.fn();
const mockBulkActionCreate = vi.fn().mockResolvedValue({
  id: 'ba-1',
  actionKey: 'csv-import',
  status: 'pending',
  fileUrl: 'https://example.com/test.csv',
  staffId: 'staff-1',
  totalCount: 0,
  successCount: 0,
  errorCount: 0,
  result: null,
  errorMessage: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});
const mockExecute = vi.fn().mockResolvedValue(undefined);

vi.mock('@/server/infrastructure/di/container', () => ({
  default: {
    getAdminPasswordRepository: () => ({
      findLatest: mockFindLatest,
    }),
    getBulkActionRepository: () => ({
      create: mockBulkActionCreate,
    }),
    getDataResetRepository: () => ({}),
    getReportRepository: () => ({}),
    getEventClusteringRepository: () => ({}),
    getSystemSettingRepository: () => ({}),
  },
}));

vi.mock(
  '@/server/application/use-cases/admin/ProcessBulkImportUseCase',
  () => ({
    default: class MockProcessBulkImportUseCase {
      execute = mockExecute;
    },
  })
);

// --- helpers ---

function createRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/admin/bulk-actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// --- tests ---

describe('POST /api/admin/bulk-actions パスワード検証', () => {
  const passwordService = new PasswordService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resetBeforeImport=false の場合、パスワード検証なしでインポートを開始する', async () => {
    const res = await POST(
      createRequest({
        fileUrl: 'https://example.com/test.csv',
        actionKey: 'csv-import',
        resetBeforeImport: false,
      })
    );

    expect(res.status).toBe(200);
    expect(mockFindLatest).not.toHaveBeenCalled();
    expect(mockBulkActionCreate).toHaveBeenCalledTimes(1);
  });

  it('resetBeforeImport=true でパスワード未送信の場合、400を返す', async () => {
    const res = await POST(
      createRequest({
        fileUrl: 'https://example.com/test.csv',
        actionKey: 'csv-import',
        resetBeforeImport: true,
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('確認コードを入力してください');
    expect(mockBulkActionCreate).not.toHaveBeenCalled();
  });

  it('resetBeforeImport=true でパスワードが有効化されていない場合、400を返す', async () => {
    mockFindLatest.mockResolvedValue(undefined);

    const res = await POST(
      createRequest({
        fileUrl: 'https://example.com/test.csv',
        actionKey: 'csv-import',
        resetBeforeImport: true,
        resetPassword: 'AB12',
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('リセットが有効化されていません');
    expect(mockBulkActionCreate).not.toHaveBeenCalled();
  });

  it('resetBeforeImport=true で間違ったパスワードの場合、400を返す', async () => {
    const correctHash = passwordService.hash('AB12');
    mockFindLatest.mockResolvedValue(correctHash);

    const res = await POST(
      createRequest({
        fileUrl: 'https://example.com/test.csv',
        actionKey: 'csv-import',
        resetBeforeImport: true,
        resetPassword: 'XXXX',
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('パスワードが正しくありません');
    expect(mockBulkActionCreate).not.toHaveBeenCalled();
  });

  it('resetBeforeImport=true で正しいパスワードの場合、インポートを開始する', async () => {
    const password = 'AB12';
    const correctHash = passwordService.hash(password);
    mockFindLatest.mockResolvedValue(correctHash);

    const res = await POST(
      createRequest({
        fileUrl: 'https://example.com/test.csv',
        actionKey: 'csv-import',
        resetBeforeImport: true,
        resetPassword: password,
      })
    );

    expect(res.status).toBe(200);
    expect(mockBulkActionCreate).toHaveBeenCalledTimes(1);
  });
});
