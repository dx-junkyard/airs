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
  ACTION_DATETIME_NOW,
  ACTION_SELECT_DATETIME,
  ACTION_SKIP_PHOTO,
} from '@/features/line-bot/constants/postbackActions';

// ── Mocks ──

const mockSessionRepo: ILineSessionRepository = {
  findByLineUserId: vi.fn(),
  save: vi.fn().mockResolvedValue({} as LineSessionData),
  deleteByLineUserId: vi.fn(),
  deleteExpired: vi.fn(),
};

// Import after mocks
import DateTimeHandler from '@/features/line-bot/services/handlers/DateTimeHandler';

// ── Helpers ──

function makeSession(
  stateOverrides: Partial<LineSessionState> = {}
): LineSessionData {
  return {
    id: 'session-1',
    lineUserId: 'user-123',
    step: 'datetime',
    state: {
      ...createInitialSessionState(),
      animalType: 'monkey',
      ...stateOverrides,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
  };
}

function postbackEvent(
  data: string,
  params?: { datetime?: string }
): LineEventInput {
  return {
    type: 'postback',
    postbackData: data,
    postbackParams: params,
  };
}

function textEvent(text: string): LineEventInput {
  return { type: 'message', text };
}

// ── Tests ──

describe('DateTimeHandler', () => {
  let handler: DateTimeHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new DateTimeHandler(mockSessionRepo);
  });

  it('transitions to location on DATETIME_NOW', async () => {
    const session = makeSession();
    const event = postbackEvent(
      buildPostbackData({ action: ACTION_DATETIME_NOW })
    );

    const result = await handler.handle(session, event);

    expect(mockSessionRepo.save).toHaveBeenCalledWith(
      'user-123',
      'location',
      expect.objectContaining({ dateTime: expect.any(String) })
    );
    expect(result.replyMessages).toHaveLength(2);
    expect(
      (result.replyMessages[0] as { text: string }).text
    ).toContain('📅');
  });

  it('transitions to location on SELECT_DATETIME with datetime param', async () => {
    const session = makeSession();
    const event = postbackEvent(
      buildPostbackData({ action: ACTION_SELECT_DATETIME }),
      { datetime: '2024-06-15T14:30' }
    );

    const result = await handler.handle(session, event);

    expect(mockSessionRepo.save).toHaveBeenCalledWith(
      'user-123',
      'location',
      expect.objectContaining({ dateTime: expect.any(String) })
    );
    expect(result.replyMessages).toHaveLength(2);
    expect(
      (result.replyMessages[0] as { text: string }).text
    ).toContain('📅');
  });

  it('re-prompts on text message', async () => {
    const session = makeSession();
    const event = textEvent('今');

    const result = await handler.handle(session, event);

    expect(mockSessionRepo.save).not.toHaveBeenCalled();
    expect(result.replyMessages).toHaveLength(1);
    expect(
      (result.replyMessages[0] as { text: string }).text
    ).toContain('日時');
  });

  it('re-prompts on unrelated postback', async () => {
    const session = makeSession();
    const event = postbackEvent(
      buildPostbackData({ action: ACTION_SKIP_PHOTO })
    );

    const result = await handler.handle(session, event);

    expect(mockSessionRepo.save).not.toHaveBeenCalled();
    expect(
      (result.replyMessages[0] as { text: string }).text
    ).toContain('日時');
  });

  it('re-prompts on SELECT_DATETIME without datetime param', async () => {
    const session = makeSession();
    const event = postbackEvent(
      buildPostbackData({ action: ACTION_SELECT_DATETIME })
    );

    const result = await handler.handle(session, event);

    expect(mockSessionRepo.save).not.toHaveBeenCalled();
    expect(
      (result.replyMessages[0] as { text: string }).text
    ).toContain('日時');
  });
});
