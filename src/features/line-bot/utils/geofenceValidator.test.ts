import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock DIContainer before importing the module under test
const mockExecute = vi.fn();

vi.mock('@/server/infrastructure/di/container', () => ({
  default: {
    getSystemSettingRepository: vi.fn(() => ({})),
  },
}));

vi.mock(
  '@/server/application/use-cases/system-setting/GetSystemSettingUseCase',
  () => ({
    default: class {
      execute = mockExecute;
    },
  })
);

import { validateGeofence } from '@/features/line-bot/utils/geofenceValidator';

describe('validateGeofence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isAllowed=true when address matches the prefix', async () => {
    mockExecute.mockResolvedValue({
      value: { geofenceAddressPrefix: '東京都' },
    });

    const result = await validateGeofence('東京都千代田区');
    expect(result).toEqual({ isAllowed: true, prefix: '東京都' });
  });

  it('returns isAllowed=false when address does not match the prefix', async () => {
    mockExecute.mockResolvedValue({
      value: { geofenceAddressPrefix: '東京都' },
    });

    const result = await validateGeofence('大阪府大阪市');
    expect(result).toEqual({ isAllowed: false, prefix: '東京都' });
  });

  it('returns isAllowed=true when prefix is empty (geofence disabled)', async () => {
    mockExecute.mockResolvedValue({
      value: { geofenceAddressPrefix: '' },
    });

    const result = await validateGeofence('大阪府大阪市');
    expect(result).toEqual({ isAllowed: true, prefix: '' });
  });

  it('returns isAllowed=true when prefix is undefined (geofence disabled)', async () => {
    mockExecute.mockResolvedValue({
      value: { geofenceAddressPrefix: undefined },
    });

    const result = await validateGeofence('どこでも');
    expect(result).toEqual({ isAllowed: true, prefix: '' });
  });
});
