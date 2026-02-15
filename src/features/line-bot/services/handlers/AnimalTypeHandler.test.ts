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
  ACTION_SELECT_ANIMAL,
  ACTION_SKIP_PHOTO,
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
    getSystemSettingRepository: vi.fn(() => ({})),
  },
}));

vi.mock(
  '@/server/application/use-cases/system-setting/GetSystemSettingUseCase',
  () => ({
    default: class {
      execute = vi.fn().mockResolvedValue({
        value: {
          animalTypesJson: JSON.stringify([
            'monkey',
            'deer',
            'wild_boar',
            'bear',
            'other',
          ]),
        },
      });
    },
  })
);

// Import after mocks
import AnimalTypeHandler from '@/features/line-bot/services/handlers/AnimalTypeHandler';

// ── Helpers ──

function makeSession(
  stateOverrides: Partial<LineSessionState> = {}
): LineSessionData {
  return {
    id: 'session-1',
    lineUserId: 'user-123',
    step: 'animal-type',
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

describe('AnimalTypeHandler', () => {
  let handler: AnimalTypeHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new AnimalTypeHandler(mockSessionRepo);
  });

  it('transitions to photo step on valid animal postback', async () => {
    const session = makeSession();
    const event = postbackEvent(
      buildPostbackData({ action: ACTION_SELECT_ANIMAL, value: 'monkey' })
    );

    const result = await handler.handle(session, event);

    expect(mockSessionRepo.save).toHaveBeenCalledWith(
      'user-123',
      'photo',
      expect.objectContaining({ animalType: 'monkey' })
    );
    expect(result.replyMessages.length).toBeGreaterThan(0);
  });

  it('saves correct animal type for deer', async () => {
    const session = makeSession();
    const event = postbackEvent(
      buildPostbackData({ action: ACTION_SELECT_ANIMAL, value: 'deer' })
    );

    await handler.handle(session, event);

    expect(mockSessionRepo.save).toHaveBeenCalledWith(
      'user-123',
      'photo',
      expect.objectContaining({ animalType: 'deer' })
    );
  });

  it('re-prompts on text message', async () => {
    const session = makeSession();
    const event = textEvent('サル');

    const result = await handler.handle(session, event);

    expect(mockSessionRepo.save).not.toHaveBeenCalled();
    expect(
      (result.replyMessages[0] as { text: string }).text
    ).toContain('どの動物');
  });

  it('re-prompts on unrelated postback action', async () => {
    const session = makeSession();
    const event = postbackEvent(
      buildPostbackData({ action: ACTION_SKIP_PHOTO })
    );

    const result = await handler.handle(session, event);

    expect(mockSessionRepo.save).not.toHaveBeenCalled();
    expect(
      (result.replyMessages[0] as { text: string }).text
    ).toContain('どの動物');
  });

  it('re-prompts on postback without value', async () => {
    const session = makeSession();
    const event = postbackEvent(
      buildPostbackData({ action: ACTION_SELECT_ANIMAL })
    );

    const result = await handler.handle(session, event);

    expect(mockSessionRepo.save).not.toHaveBeenCalled();
    expect(
      (result.replyMessages[0] as { text: string }).text
    ).toContain('どの動物');
  });

  describe('getEnabledAnimalTypes', () => {
    it('returns animal types from system setting', async () => {
      const types = await handler.getEnabledAnimalTypes();

      expect(types).toHaveLength(5);
      expect(types[0].id).toBe('monkey');
    });

    it('caches result on second call', async () => {
      const first = await handler.getEnabledAnimalTypes();
      const second = await handler.getEnabledAnimalTypes();

      expect(first).toBe(second);
    });
  });
});
