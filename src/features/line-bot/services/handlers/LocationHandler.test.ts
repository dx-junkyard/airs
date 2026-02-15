import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ILineSessionRepository,
  LineSessionData,
} from '@/server/domain/repositories/ILineSessionRepository';
import type { LineEventInput } from '@/features/line-bot/types/lineMessages';
import { createInitialSessionState } from '@/features/line-bot/types/lineSession';
import type { LineSessionState } from '@/features/line-bot/types/lineSession';
import { buildPostbackData } from '@/features/line-bot/utils/postbackParser';
import {
  ACTION_SELECT_LANDMARK,
  ACTION_SKIP_LANDMARK,
} from '@/features/line-bot/constants/postbackActions';

// ── Mocks ──

const mockSessionRepo: ILineSessionRepository = {
  findByLineUserId: vi.fn(),
  save: vi.fn().mockResolvedValue({} as LineSessionData),
  deleteByLineUserId: vi.fn(),
  deleteExpired: vi.fn(),
};

vi.mock('@/server/infrastructure/di/container', () => ({
  default: {
    getGeoRepository: vi.fn(() => ({})),
  },
}));

vi.mock('@/server/application/use-cases/geo/ReverseGeocodeUseCase', () => ({
  default: class {
    execute = vi.fn().mockResolvedValue({
      address: '東京都千代田区',
      normalizedAddress: {
        prefecture: '東京都',
        city: '千代田区',
        oaza: '',
        aza: '',
        detail: '',
        full: '東京都千代田区',
        areaKey: 'tokyo-chiyoda',
      },
    });
  },
}));

vi.mock(
  '@/server/application/use-cases/geo/SearchNearbyLandmarksUseCase',
  () => ({
    default: class {
      execute = vi.fn().mockResolvedValue([]);
    },
  })
);

vi.mock('@/features/line-bot/utils/geofenceValidator', () => ({
  validateGeofence: vi
    .fn()
    .mockResolvedValue({ isAllowed: true, prefix: '' }),
}));

// Import after mocks
import LocationHandler from '@/features/line-bot/services/handlers/LocationHandler';
import { validateGeofence } from '@/features/line-bot/utils/geofenceValidator';

// ── Helpers ──

function makeSession(
  stateOverrides: Partial<LineSessionState> = {}
): LineSessionData {
  return {
    id: 'session-1',
    lineUserId: 'user-123',
    step: 'location',
    state: {
      ...createInitialSessionState(),
      animalType: 'monkey',
      dateTime: new Date().toISOString(),
      ...stateOverrides,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function postbackEvent(data: string): LineEventInput {
  return { type: 'postback', postbackData: data };
}

function textEvent(text: string): LineEventInput {
  return { type: 'message', text };
}

function locationEvent(lat: number, lng: number): LineEventInput {
  return { type: 'message', location: { latitude: lat, longitude: lng } };
}

// ── Tests ──

describe('LocationHandler', () => {
  let handler: LocationHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new LocationHandler(mockSessionRepo);
  });

  it('processes location message and transitions to action-category', async () => {
    const session = makeSession();
    const event = locationEvent(35.6762, 139.6503);

    const result = await handler.handle(session, event);

    expect(mockSessionRepo.save).toHaveBeenCalledWith(
      'user-123',
      'action-category',
      expect.objectContaining({
        location: expect.objectContaining({
          latitude: 35.6762,
          longitude: 139.6503,
          address: '東京都千代田区',
        }),
      })
    );
    // Should return action category messages (guidance + category)
    expect(result.replyMessages.length).toBe(2);
  });

  it('rejects location outside geofence', async () => {
    vi.mocked(validateGeofence).mockResolvedValueOnce({
      isAllowed: false,
      prefix: '東京都',
    });
    const session = makeSession();
    const event = locationEvent(34.0, 135.0);

    const result = await handler.handle(session, event);

    const texts = result.replyMessages.map(
      (m) => (m as { text?: string }).text ?? ''
    );
    expect(texts.some((t) => t.includes('対象地域'))).toBe(true);
  });

  it('rejects text input for address', async () => {
    const session = makeSession();
    const event = textEvent('東京都千代田区');

    const result = await handler.handle(session, event);

    const texts = result.replyMessages.map(
      (m) => (m as { text?: string }).text ?? ''
    );
    expect(texts.some((t) => t.includes('テキスト入力は利用できません'))).toBe(
      true
    );
  });

  it('re-prompts on unrelated event', async () => {
    const session = makeSession();
    const event: LineEventInput = { type: 'message' };

    const result = await handler.handle(session, event);

    expect(result.replyMessages).toHaveLength(1);
  });

  describe('landmark selection', () => {
    it('saves landmark name on SELECT_LANDMARK', async () => {
      const session = makeSession({
        location: {
          latitude: 35.6762,
          longitude: 139.6503,
          address: '東京都千代田区',
        },
        nearbyLandmarks: [
          {
            id: 'lm1',
            name: '中央公園',
            category: '公園',
            distance: 50,
            latitude: 35.0,
            longitude: 139.0,
          },
        ],
      });
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_SELECT_LANDMARK, id: 'lm1' })
      );

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'action-category',
        expect.objectContaining({
          location: expect.objectContaining({ landmarkName: '中央公園' }),
        })
      );
      expect(result.replyMessages.length).toBe(2);
    });

    it('proceeds without landmark on SKIP_LANDMARK', async () => {
      const session = makeSession({
        location: {
          latitude: 35.6762,
          longitude: 139.6503,
          address: '東京都千代田区',
        },
        nearbyLandmarks: [
          {
            id: 'lm1',
            name: '中央公園',
            category: '公園',
            distance: 50,
            latitude: 35.0,
            longitude: 139.0,
          },
        ],
      });
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_SKIP_LANDMARK })
      );

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'action-category',
        expect.objectContaining({
          location: expect.objectContaining({ landmarkName: undefined }),
        })
      );
      expect(result.replyMessages.length).toBe(2);
    });
  });
});
