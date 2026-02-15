import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ILineSessionRepository, LineSessionData } from '@/server/domain/repositories/ILineSessionRepository';
import type { LineEventInput } from '@/features/line-bot/types/lineMessages';
import { createInitialSessionState } from '@/features/line-bot/types/lineSession';
import type { LineSessionState } from '@/features/line-bot/types/lineSession';
import { buildPostbackData } from '@/features/line-bot/utils/postbackParser';
import {
  ACTION_CONFIRM_REPORT,
  ACTION_DATETIME_NOW,
  ACTION_SELECT_ANIMAL,
  ACTION_SKIP_PHONE_NUMBER,
  ACTION_SKIP_PHOTO,
  ACTION_START_OVER,
} from '@/features/line-bot/constants/postbackActions';

// ── Mocks ──

const mockSessionRepo: ILineSessionRepository = {
  findByLineUserId: vi.fn(),
  save: vi.fn().mockResolvedValue({} as LineSessionData),
  deleteByLineUserId: vi.fn(),
  deleteExpired: vi.fn(),
};

const mockLineClient = {
  reply: vi.fn(),
  push: vi.fn(),
  markAsRead: vi.fn(),
  getMessageContent: vi.fn(),
} as unknown as import('@/server/infrastructure/line/LineMessagingClient').default;

// Mock modules
vi.mock('@/server/infrastructure/di/container', () => ({
  default: {
    getSystemSettingRepository: vi.fn(() => ({})),
    getReportRegistrationService: vi.fn(() => ({
      execute: vi.fn().mockResolvedValue({ id: 'report-123' }),
    })),
    getImageRepository: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue('https://blob.example.com/image.jpg'),
    })),
    getGeoRepository: vi.fn(() => ({})),
  },
}));

vi.mock(
  '@/server/application/use-cases/system-setting/GetSystemSettingUseCase',
  () => ({
    default: class {
      execute = vi.fn().mockResolvedValue({
        value: {
          animalTypesJson: JSON.stringify(['monkey', 'deer', 'wild_boar', 'bear', 'other']),
          geofenceAddressPrefix: '',
        },
      });
    },
  })
);

vi.mock('@/features/ai-report/actions', () => ({
  analyzeImageWithAI: vi.fn().mockResolvedValue({
    success: true,
    containsAnimalOrTrace: true,
    isImageClear: true,
    description: 'サルが映っています',
  }),
  generateReportDraft: vi.fn().mockResolvedValue({
    when: '2024年1月15日',
    where: '東京都千代田区',
    what: 'サル',
    situation: '目撃しました',
  }),
  regenerateReportDraft: vi.fn().mockResolvedValue({
    when: '2024年1月15日',
    where: '東京都千代田区',
    what: 'サル',
    situation: '修正済み',
  }),
}));

vi.mock('@/features/ai-report/actions/actionDetailActions', () => ({
  generateQuestion: vi.fn().mockResolvedValue({ success: false, question: null }),
  generateAllQuestions: vi.fn().mockResolvedValue({ success: false, questions: [] }),
  generateActionDetail: vi.fn().mockResolvedValue({ success: true, detail: '行動詳細' }),
  regenerateActionDetail: vi.fn().mockResolvedValue({ success: true, detail: '修正済み行動詳細' }),
}));

vi.mock('@/features/line-bot/utils/geofenceValidator', () => ({
  validateGeofence: vi.fn().mockResolvedValue({ isAllowed: true, prefix: '' }),
}));

vi.mock('@/features/line-bot/services/LineImageService', () => ({
  uploadLineImage: vi.fn().mockResolvedValue('https://blob.example.com/image.jpg'),
}));

vi.mock('@/server/infrastructure/auth/reportToken', () => ({
  generateReportToken: vi.fn().mockResolvedValue('jwt-token-123'),
}));

vi.mock('@/server/infrastructure/line/lineConfig', () => ({
  getAppUrl: vi.fn().mockReturnValue('https://example.com'),
  lineConfig: { channelAccessToken: 'test-token', channelSecret: 'test-secret' },
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

vi.mock('@/server/application/use-cases/geo/SearchNearbyLandmarksUseCase', () => ({
  default: class {
    execute = vi.fn().mockResolvedValue([]);
  },
}));

vi.mock('@/features/ai-report/utils/locationFormatter', () => ({
  formatLocationWithLandmark: vi.fn().mockReturnValue('東京都千代田区'),
}));

// Import the module under test AFTER mocks
import LineConversationService from '@/features/line-bot/services/LineConversationService';

// ── Helpers ──

function makeSession(
  step: string,
  stateOverrides: Partial<LineSessionState> = {}
): LineSessionData {
  return {
    id: 'session-1',
    lineUserId: 'user-123',
    step: step as LineSessionData['step'],
    state: { ...createInitialSessionState(), ...stateOverrides },
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

// ── Tests ──

describe('LineConversationService', () => {
  let service: LineConversationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LineConversationService(mockSessionRepo, mockLineClient);
  });

  // ============================================================
  // processEvent: reset
  // ============================================================

  describe('processEvent - reset command', () => {
    it('deletes session on "リセット" text', async () => {
      const session = makeSession('photo');
      const event = textEvent('リセット');

      const result = await service.processEvent(session, event);

      expect(mockSessionRepo.deleteByLineUserId).toHaveBeenCalledWith('user-123');
      expect(result.replyMessages).toHaveLength(1);
      expect((result.replyMessages[0] as { text: string }).text).toContain('中断');
    });

    it('deletes session on "reset" text (case-insensitive)', async () => {
      const session = makeSession('datetime');
      const event = textEvent('  Reset  ');

      const result = await service.processEvent(session, event);

      expect(mockSessionRepo.deleteByLineUserId).toHaveBeenCalledWith('user-123');
      expect(result.replyMessages).toHaveLength(1);
    });
  });

  // ============================================================
  // processEvent: start_over postback
  // ============================================================

  describe('processEvent - start_over postback', () => {
    it('creates a new session on start_over postback from any step', async () => {
      const session = makeSession('confirm');
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_START_OVER })
      );

      const result = await service.processEvent(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'animal-type',
        expect.anything()
      );
      expect(result.replyMessages).toHaveLength(1);
      expect((result.replyMessages[0] as { text: string }).text).toContain('どの動物');
    });
  });

  // ============================================================
  // startNewSession
  // ============================================================

  describe('startNewSession', () => {
    it('creates a session at animal-type step and returns animal type message', async () => {
      const result = await service.startNewSession('user-123');

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'animal-type',
        expect.anything()
      );
      expect(result.replyMessages).toHaveLength(1);
      expect((result.replyMessages[0] as { text: string }).text).toContain('どの動物');
    });
  });

  // ============================================================
  // handleAnimalType
  // ============================================================

  describe('processEvent - animal-type step', () => {
    it('transitions to photo step on valid animal postback', async () => {
      const session = makeSession('animal-type');
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_SELECT_ANIMAL, value: 'monkey' })
      );

      const result = await service.processEvent(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'photo',
        expect.objectContaining({ animalType: 'monkey' })
      );
      expect(result.replyMessages.length).toBeGreaterThan(0);
    });

    it('re-prompts when event is not a postback', async () => {
      const session = makeSession('animal-type');
      const event = textEvent('サル');

      const result = await service.processEvent(session, event);

      expect((result.replyMessages[0] as { text: string }).text).toContain('どの動物');
    });
  });

  // ============================================================
  // handlePhoto
  // ============================================================

  describe('processEvent - photo step', () => {
    it('transitions to datetime on SKIP_PHOTO', async () => {
      const session = makeSession('photo', { animalType: 'monkey' });
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_SKIP_PHOTO })
      );

      const result = await service.processEvent(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'datetime',
        expect.anything()
      );
      expect(result.replyMessages).toHaveLength(1);
      expect((result.replyMessages[0] as { text: string }).text).toContain('日時');
    });
  });

  // ============================================================
  // handlePhoneNumber
  // ============================================================

  describe('processEvent - phone-number step', () => {
    const baseState: Partial<LineSessionState> = {
      animalType: 'monkey',
      situation: 'サルを目撃',
      dateTime: new Date().toISOString(),
      location: {
        latitude: 35.6762,
        longitude: 139.6503,
        address: '東京都千代田区',
      },
      reportDraft: {
        when: '2024年1月15日',
        where: '東京都千代田区',
        what: 'サル',
        situation: '目撃しました',
      },
    };

    it('submits report on valid phone number', async () => {
      const session = makeSession('phone-number', baseState);
      const event = textEvent('090-1234-5678');

      const result = await service.processEvent(session, event);

      // Should save phone number
      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'phone-number',
        expect.objectContaining({ phoneNumber: '090-1234-5678' })
      );
      // Should have completion messages (submitting + completion)
      expect(result.replyMessages.length).toBeGreaterThanOrEqual(1);
    });

    it('returns error on invalid phone number', async () => {
      const session = makeSession('phone-number', baseState);
      const event = textEvent('12345');

      const result = await service.processEvent(session, event);

      const texts = result.replyMessages.map(
        (m) => (m as { text?: string }).text ?? ''
      );
      expect(texts.some((t) => t.includes('形式が正しくありません'))).toBe(true);
    });

    it('submits report on SKIP_PHONE_NUMBER postback', async () => {
      const session = makeSession('phone-number', baseState);
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_SKIP_PHONE_NUMBER })
      );

      const result = await service.processEvent(session, event);

      // Should contain submission messages
      expect(result.replyMessages.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================
  // Step dispatch
  // ============================================================

  describe('processEvent - step dispatch', () => {
    it('dispatches datetime step correctly', async () => {
      const session = makeSession('datetime', { animalType: 'monkey' });
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_DATETIME_NOW })
      );

      const result = await service.processEvent(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'location',
        expect.objectContaining({ dateTime: expect.any(String) })
      );
      expect(result.replyMessages.length).toBe(2);
    });

    it('dispatches confirm step - transitions to phone-number on CONFIRM_REPORT', async () => {
      const session = makeSession('confirm', {
        animalType: 'monkey',
        reportDraft: {
          when: '2024年1月15日',
          where: '東京都千代田区',
          what: 'サル',
          situation: '目撃しました',
        },
      });
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_CONFIRM_REPORT })
      );

      const result = await service.processEvent(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'phone-number',
        expect.anything()
      );
      expect(result.replyMessages).toHaveLength(1);
    });

    it('starts new session on "complete" step', async () => {
      const session = makeSession('complete');
      const event = textEvent('hello');

      const result = await service.processEvent(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'animal-type',
        expect.anything()
      );
      expect(result.replyMessages).toHaveLength(1);
    });

    it('starts new session on unknown step', async () => {
      const session = makeSession('unknown-step');
      const event = textEvent('hello');

      const result = await service.processEvent(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'animal-type',
        expect.anything()
      );
    });
  });
});
