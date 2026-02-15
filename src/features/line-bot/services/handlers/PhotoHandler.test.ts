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
  ACTION_SKIP_PHOTO,
  ACTION_ADD_PHOTO,
  ACTION_CONFIRM_DESC,
  ACTION_REJECT_DESC,
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

vi.mock('@/features/ai-report/actions', () => ({
  analyzeImageWithAI: vi.fn().mockResolvedValue({
    success: true,
    containsAnimalOrTrace: true,
    isImageClear: true,
    description: 'サルが映っています',
  }),
}));

vi.mock('@/features/line-bot/services/LineImageService', () => ({
  uploadLineImage: vi
    .fn()
    .mockResolvedValue('https://blob.example.com/image.jpg'),
}));

// Import after mocks
import PhotoHandler from '@/features/line-bot/services/handlers/PhotoHandler';
import { analyzeImageWithAI } from '@/features/ai-report/actions';

// ── Helpers ──

function makeSession(
  step: 'photo' | 'image-description',
  stateOverrides: Partial<LineSessionState> = {}
): LineSessionData {
  return {
    id: 'session-1',
    lineUserId: 'user-123',
    step,
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

function postbackEvent(data: string): LineEventInput {
  return { type: 'postback', postbackData: data };
}

function textEvent(text: string): LineEventInput {
  return { type: 'message', text };
}

function imageEvent(): LineEventInput {
  return { type: 'message', imageMessageId: 'img-123' };
}

// ── Tests ──

describe('PhotoHandler', () => {
  let handler: PhotoHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new PhotoHandler(mockSessionRepo, mockLineClient);
  });

  // ==============================
  // photo step
  // ==============================

  describe('photo step', () => {
    it('transitions to datetime on SKIP_PHOTO', async () => {
      const session = makeSession('photo');
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_SKIP_PHOTO })
      );

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'datetime',
        expect.anything()
      );
      expect(
        (result.replyMessages[0] as { text: string }).text
      ).toContain('日時');
    });

    it('shows add photo prompt on ADD_PHOTO', async () => {
      const session = makeSession('photo');
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_ADD_PHOTO })
      );

      const result = await handler.handle(session, event);

      expect(
        (result.replyMessages[0] as { text: string }).text
      ).toContain('写真');
    });

    it('processes image upload on image message', async () => {
      const session = makeSession('photo');
      const event = imageEvent();

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'image-description',
        expect.objectContaining({
          images: expect.arrayContaining([
            expect.objectContaining({
              url: 'https://blob.example.com/image.jpg',
            }),
          ]),
        })
      );
      expect(result.replyMessages.length).toBeGreaterThan(0);
    });

    it('shows rejection when image is not clear', async () => {
      vi.mocked(analyzeImageWithAI).mockResolvedValueOnce({
        success: true,
        isImageClear: false,
        containsAnimalOrTrace: false,
        description: '不鮮明な画像です',
      });
      const session = makeSession('photo');
      const event = imageEvent();

      const result = await handler.handle(session, event);

      const texts = result.replyMessages.map(
        (m) => (m as { text?: string }).text ?? ''
      );
      expect(texts.some((t) => t.includes('不鮮明'))).toBe(true);
      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'photo',
        expect.objectContaining({ imageRejectionCount: 1 })
      );
    });

    it('shows rejection when no animal detected', async () => {
      vi.mocked(analyzeImageWithAI).mockResolvedValueOnce({
        success: true,
        isImageClear: true,
        containsAnimalOrTrace: false,
        description: '風景のみ',
      });
      const session = makeSession('photo');
      const event = imageEvent();

      const result = await handler.handle(session, event);

      const texts = result.replyMessages.map(
        (m) => (m as { text?: string }).text ?? ''
      );
      expect(texts.some((t) => t.includes('痕跡が確認できません'))).toBe(true);
    });

    it('skips screening after 2 rejections', async () => {
      vi.mocked(analyzeImageWithAI).mockResolvedValueOnce({
        success: true,
        isImageClear: false,
        containsAnimalOrTrace: false,
        description: 'test',
      });
      const session = makeSession('photo', { imageRejectionCount: 2 });
      const event = imageEvent();

      const result = await handler.handle(session, event);

      // Should pass screening and go to image-description
      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'image-description',
        expect.anything()
      );
    });

    it('shows animal mismatch warning', async () => {
      vi.mocked(analyzeImageWithAI).mockResolvedValueOnce({
        success: true,
        isImageClear: true,
        containsAnimalOrTrace: true,
        detectedAnimalType: 'bear',
        description: 'クマが映っています',
      });
      const session = makeSession('photo', { animalType: 'monkey' });
      const event = imageEvent();

      const result = await handler.handle(session, event);

      const texts = result.replyMessages.map(
        (m) => (m as { text?: string }).text ?? ''
      );
      expect(texts.some((t) => t.includes('クマ') && t.includes('サル'))).toBe(
        true
      );
    });

    it('re-sends photo prompt on text message', async () => {
      const session = makeSession('photo');
      const event = textEvent('こんにちは');

      const result = await handler.handle(session, event);

      expect(result.replyMessages.length).toBeGreaterThan(0);
    });
  });

  // ==============================
  // image-description step
  // ==============================

  describe('image-description step', () => {
    it('saves situation on CONFIRM_DESC', async () => {
      const session = makeSession('image-description', {
        imageAnalysisDescription: 'サルが2頭います',
      });
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_CONFIRM_DESC })
      );

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'photo',
        expect.objectContaining({ situation: 'サルが2頭います' })
      );
      expect(result.replyMessages.length).toBeGreaterThan(0);
    });

    it('prompts for correction text on REJECT_DESC', async () => {
      const session = makeSession('image-description', {
        imageAnalysisDescription: 'サルが2頭います',
      });
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_REJECT_DESC })
      );

      const result = await handler.handle(session, event);

      expect(
        (result.replyMessages[0] as { text: string }).text
      ).toContain('どのように違うか');
    });

    it('appends correction text to situation on text input', async () => {
      const session = makeSession('image-description', {
        imageAnalysisDescription: 'サルが2頭います',
      });
      const event = textEvent('実は3頭です');

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'photo',
        expect.objectContaining({
          situation: 'サルが2頭います（補足: 実は3頭です）',
        })
      );
      expect(
        (result.replyMessages[0] as { text: string }).text
      ).toContain('ありがとう');
    });

    it('transitions to datetime on SKIP_PHOTO from image-description', async () => {
      const session = makeSession('image-description');
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_SKIP_PHOTO })
      );

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'datetime',
        expect.anything()
      );
      expect(
        (result.replyMessages[0] as { text: string }).text
      ).toContain('日時');
    });

    it('transitions to photo on ADD_PHOTO from image-description', async () => {
      const session = makeSession('image-description');
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_ADD_PHOTO })
      );

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'photo',
        expect.anything()
      );
    });

    it('re-displays description when no postback', async () => {
      const session = makeSession('image-description', {
        imageAnalysisDescription: 'サルが映っています',
      });
      // Non-postback, non-text event (e.g. sticker)
      const event: LineEventInput = { type: 'message' };

      const result = await handler.handle(session, event);

      const texts = result.replyMessages.map(
        (m) => (m as { text?: string }).text ?? ''
      );
      expect(texts.some((t) => t.includes('サルが映っています'))).toBe(true);
    });
  });
});
