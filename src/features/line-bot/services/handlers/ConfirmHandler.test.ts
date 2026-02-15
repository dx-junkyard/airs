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
  ACTION_CONFIRM_REPORT,
  ACTION_SKIP_PHONE_NUMBER,
  ACTION_REQUEST_PHONE_NUMBER,
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
    getReportRegistrationService: vi.fn(() => ({
      execute: vi.fn().mockResolvedValue({ id: 'report-123' }),
    })),
  },
}));

vi.mock('@/server/infrastructure/auth/reportToken', () => ({
  generateReportToken: vi.fn().mockResolvedValue('jwt-token-123'),
}));

vi.mock('@/server/infrastructure/line/lineConfig', () => ({
  getAppUrl: vi.fn().mockReturnValue('https://example.com'),
  lineConfig: {
    channelAccessToken: 'test-token',
    channelSecret: 'test-secret',
  },
}));

vi.mock('@/features/ai-report/utils/locationFormatter', () => ({
  formatLocationWithLandmark: vi.fn().mockReturnValue('東京都千代田区'),
}));

// Import after mocks
import ConfirmHandler from '@/features/line-bot/services/handlers/ConfirmHandler';
import LocationHandler from '@/features/line-bot/services/handlers/LocationHandler';

// ── Helpers ──

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

function makeSession(
  step: 'confirm' | 'phone-number',
  stateOverrides: Partial<LineSessionState> = {}
): LineSessionData {
  return {
    id: 'session-1',
    lineUserId: 'user-123',
    step,
    state: {
      ...createInitialSessionState(),
      ...baseState,
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

// ── Tests ──

describe('ConfirmHandler', () => {
  let handler: ConfirmHandler;
  let locationHandler: LocationHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    locationHandler = new LocationHandler(mockSessionRepo);
    handler = new ConfirmHandler(mockSessionRepo, locationHandler);
  });

  // ==============================
  // confirm step
  // ==============================

  describe('confirm step', () => {
    it('transitions to phone-number on CONFIRM_REPORT', async () => {
      const session = makeSession('confirm');
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_CONFIRM_REPORT })
      );

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'phone-number',
        expect.anything()
      );
      expect(result.replyMessages).toHaveLength(1);
    });

    it('re-displays draft on text message', async () => {
      const session = makeSession('confirm');
      const event = textEvent('修正したい');

      const result = await handler.handle(session, event);

      expect(result.replyMessages).toHaveLength(1);
      expect((result.replyMessages[0] as { type: string }).type).toBe('flex');
    });

    it('shows draft as flex message when no event matches', async () => {
      const session = makeSession('confirm');
      const event: LineEventInput = { type: 'message' };

      const result = await handler.handle(session, event);

      expect(result.replyMessages).toHaveLength(1);
      expect((result.replyMessages[0] as { type: string }).type).toBe('flex');
    });

    it('shows fallback text when no draft available', async () => {
      const session = makeSession('confirm', { reportDraft: null });
      const event: LineEventInput = { type: 'message' };

      const result = await handler.handle(session, event);

      expect(
        (result.replyMessages[0] as { text: string }).text
      ).toContain('確認してください');
    });

    it('delegates landmark selection to LocationHandler', async () => {
      const session = makeSession('confirm', {
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
        expect.anything()
      );
      expect(result.replyMessages.length).toBeGreaterThan(0);
    });
  });

  // ==============================
  // phone-number step
  // ==============================

  describe('phone-number step', () => {
    it('submits report on valid phone number', async () => {
      const session = makeSession('phone-number');
      const event = textEvent('090-1234-5678');

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'phone-number',
        expect.objectContaining({ phoneNumber: '090-1234-5678' })
      );
      expect(result.replyMessages.length).toBeGreaterThanOrEqual(1);
    });

    it('accepts phone number without hyphens', async () => {
      const session = makeSession('phone-number');
      const event = textEvent('09012345678');

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'phone-number',
        expect.objectContaining({ phoneNumber: '09012345678' })
      );
    });

    it('accepts landline number', async () => {
      const session = makeSession('phone-number');
      const event = textEvent('03-1234-5678');

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'phone-number',
        expect.objectContaining({ phoneNumber: '03-1234-5678' })
      );
    });

    it('returns error on invalid phone number', async () => {
      const session = makeSession('phone-number');
      const event = textEvent('12345');

      const result = await handler.handle(session, event);

      const texts = result.replyMessages.map(
        (m) => (m as { text?: string }).text ?? ''
      );
      expect(texts.some((t) => t.includes('形式が正しくありません'))).toBe(
        true
      );
    });

    it('returns error on non-zero-starting number', async () => {
      const session = makeSession('phone-number');
      const event = textEvent('190-1234-5678');

      const result = await handler.handle(session, event);

      const texts = result.replyMessages.map(
        (m) => (m as { text?: string }).text ?? ''
      );
      expect(texts.some((t) => t.includes('形式が正しくありません'))).toBe(
        true
      );
    });

    it('submits report on SKIP_PHONE_NUMBER', async () => {
      const session = makeSession('phone-number');
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_SKIP_PHONE_NUMBER })
      );

      const result = await handler.handle(session, event);

      expect(result.replyMessages.length).toBeGreaterThanOrEqual(1);
    });

    it('returns empty messages on REQUEST_PHONE_NUMBER', async () => {
      const session = makeSession('phone-number');
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_REQUEST_PHONE_NUMBER })
      );

      const result = await handler.handle(session, event);

      expect(result.replyMessages).toHaveLength(0);
    });

    it('re-prompts on non-text non-postback event', async () => {
      const session = makeSession('phone-number');
      const event: LineEventInput = { type: 'message' };

      const result = await handler.handle(session, event);

      expect(result.replyMessages).toHaveLength(1);
    });

    it('saves session as complete after submission', async () => {
      const session = makeSession('phone-number');
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_SKIP_PHONE_NUMBER })
      );

      await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'complete',
        expect.anything()
      );
    });
  });
});
