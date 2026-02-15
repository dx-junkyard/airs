import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ILineSessionRepository,
  LineSessionData,
} from '@/server/domain/repositories/ILineSessionRepository';
import type { LineEventInput } from '@/features/line-bot/types/lineMessages';
import { createInitialSessionState } from '@/features/line-bot/types/lineSession';
import type { LineSessionState } from '@/features/line-bot/types/lineSession';
import type { QuestionCard } from '@/features/ai-report/types/actionDetail';
import { buildPostbackData } from '@/features/line-bot/utils/postbackParser';
import {
  ACTION_SELECT_ACTION,
  ACTION_ANSWER_QUESTION,
  ACTION_CONFIRM_DETAIL,
  ACTION_RESTART_DETAIL,
} from '@/features/line-bot/constants/postbackActions';

// ── Mocks ──

const mockSessionRepo: ILineSessionRepository = {
  findByLineUserId: vi.fn(),
  save: vi.fn().mockResolvedValue({} as LineSessionData),
  deleteByLineUserId: vi.fn(),
  deleteExpired: vi.fn(),
};

vi.mock('@/features/ai-report/actions/actionDetailActions', () => ({
  generateQuestion: vi
    .fn()
    .mockResolvedValue({ success: false, question: null }),
  generateAllQuestions: vi
    .fn()
    .mockResolvedValue({ success: false, questions: [] }),
  generateActionDetail: vi
    .fn()
    .mockResolvedValue({ success: true, detail: '行動詳細テスト' }),
}));

vi.mock('@/features/ai-report/actions', () => ({
  generateReportDraft: vi.fn().mockResolvedValue({
    when: '2024年1月15日',
    where: '東京都千代田区',
    what: 'サル',
    situation: '目撃しました',
  }),
}));

vi.mock('@/features/ai-report/utils/locationFormatter', () => ({
  formatLocationWithLandmark: vi.fn().mockReturnValue('東京都千代田区'),
}));

// Import after mocks
import ActionDetailHandler from '@/features/line-bot/services/handlers/ActionDetailHandler';
import { generateAllQuestions } from '@/features/ai-report/actions/actionDetailActions';

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
};

function makeSession(
  step: 'action-category' | 'action-question' | 'action-detail-confirm',
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

describe('ActionDetailHandler', () => {
  let handler: ActionDetailHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new ActionDetailHandler(mockSessionRepo);
  });

  // ==============================
  // action-category step
  // ==============================

  describe('action-category step', () => {
    it('transitions to action-question on valid category selection', async () => {
      const session = makeSession('action-category');
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_SELECT_ACTION, value: 'movement' })
      );

      const result = await handler.handle(session, event);

      // generateAllQuestions returns empty → falls through to generateActionDetail
      expect(mockSessionRepo.save).toHaveBeenCalled();
      expect(result.replyMessages.length).toBeGreaterThan(0);
    });

    it('shows first question when generateAllQuestions succeeds', async () => {
      const mockQuestion: QuestionCard = {
        questionId: 'q1',
        questionText: 'どこで見ましたか？',
        captureKey: 'location_detail',
        choices: [
          { id: 'c1', label: '道路' },
          { id: 'c2', label: '畑' },
        ],
        shouldContinue: false,
      };
      vi.mocked(generateAllQuestions).mockResolvedValueOnce({
        success: true,
        questions: [mockQuestion],
      });

      const session = makeSession('action-category');
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_SELECT_ACTION, value: 'movement' })
      );

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'action-question',
        expect.objectContaining({
          actionCategory: 'movement',
          currentQuestion: mockQuestion,
        })
      );
      expect(
        (result.replyMessages[0] as { text: string }).text
      ).toContain('どこで見ましたか');
    });

    it('re-prompts on text message', async () => {
      const session = makeSession('action-category');
      const event = textEvent('移動');

      const result = await handler.handle(session, event);

      expect(result.replyMessages.length).toBe(2); // guidance + category
    });

    it('re-prompts on postback without value', async () => {
      const session = makeSession('action-category');
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_SELECT_ACTION })
      );

      const result = await handler.handle(session, event);

      expect(result.replyMessages.length).toBe(2);
    });
  });

  // ==============================
  // action-question step
  // ==============================

  describe('action-question step', () => {
    const questionCard: QuestionCard = {
      questionId: 'q1',
      questionText: 'どこで見ましたか？',
      captureKey: 'location_detail',
      choices: [
        { id: 'c1', label: '道路' },
        { id: 'c2', label: '畑' },
      ],
      shouldContinue: false,
    };

    it('returns next question from queue when available', async () => {
      const nextQuestion: QuestionCard = {
        questionId: 'q2',
        questionText: '何頭ぐらいでしたか？',
        captureKey: 'count',
        choices: [
          { id: 'c1', label: '1頭' },
          { id: 'c2', label: '複数' },
        ],
        shouldContinue: false,
      };
      const session = makeSession('action-question', {
        actionCategory: 'movement',
        actionQuestionCount: 1,
        currentQuestion: questionCard,
        questionQueue: [nextQuestion],
      });
      const event = postbackEvent(
        buildPostbackData({
          action: ACTION_ANSWER_QUESTION,
          qid: 'q1',
          cid: 'c1',
        })
      );

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'action-question',
        expect.objectContaining({
          currentQuestion: nextQuestion,
          actionQuestionCount: 2,
        })
      );
      expect(
        (result.replyMessages[0] as { text: string }).text
      ).toContain('何頭');
    });

    it('generates action detail when queue is empty', async () => {
      const session = makeSession('action-question', {
        actionCategory: 'movement',
        actionQuestionCount: 1,
        currentQuestion: questionCard,
        questionQueue: [],
      });
      const event = postbackEvent(
        buildPostbackData({
          action: ACTION_ANSWER_QUESTION,
          qid: 'q1',
          cid: 'c1',
        })
      );

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'action-detail-confirm',
        expect.objectContaining({ actionDetail: '行動詳細テスト' })
      );
      expect(result.replyMessages.length).toBeGreaterThan(0);
    });

    it('re-prompts on text message', async () => {
      const session = makeSession('action-question', {
        currentQuestion: questionCard,
      });
      const event = textEvent('道路');

      const result = await handler.handle(session, event);

      expect(
        (result.replyMessages[0] as { text: string }).text
      ).toContain('ボタンで選択');
    });

    it('re-prompts on unrelated postback', async () => {
      const session = makeSession('action-question', {
        currentQuestion: questionCard,
      });
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_SELECT_ACTION, value: 'stay' })
      );

      const result = await handler.handle(session, event);

      expect(
        (result.replyMessages[0] as { text: string }).text
      ).toContain('ボタンで選択');
    });
  });

  // ==============================
  // action-detail-confirm step
  // ==============================

  describe('action-detail-confirm step', () => {
    it('transitions to confirm on CONFIRM_DETAIL', async () => {
      const session = makeSession('action-detail-confirm', {
        actionDetail: '行動詳細テキスト',
        actionCategory: 'movement',
      });
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_CONFIRM_DETAIL })
      );

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'confirm',
        expect.objectContaining({ situation: '行動詳細テキスト' })
      );
      // Should have draft generating + draft messages
      expect(result.replyMessages.length).toBeGreaterThanOrEqual(2);
    });

    it('returns to action-category on RESTART_DETAIL', async () => {
      const session = makeSession('action-detail-confirm', {
        actionDetail: '行動詳細テキスト',
        actionCategory: 'movement',
      });
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_RESTART_DETAIL })
      );

      const result = await handler.handle(session, event);

      expect(mockSessionRepo.save).toHaveBeenCalledWith(
        'user-123',
        'action-category',
        expect.objectContaining({
          actionCategory: null,
          actionDetail: null,
        })
      );
      expect(result.replyMessages.length).toBe(2); // guidance + category
    });

    it('re-displays detail on text message', async () => {
      const session = makeSession('action-detail-confirm', {
        actionDetail: '行動詳細テキスト',
      });
      const event = textEvent('修正したい');

      const result = await handler.handle(session, event);

      expect(
        (result.replyMessages[0] as { text: string }).text
      ).toContain('行動詳細テキスト');
    });

    it('shows fallback text when no actionDetail on text message', async () => {
      const session = makeSession('action-detail-confirm', {
        actionDetail: null,
      });
      const event = textEvent('test');

      const result = await handler.handle(session, event);

      expect(
        (result.replyMessages[0] as { text: string }).text
      ).toContain('確認してください');
    });

    it('re-displays detail on unrelated postback', async () => {
      const session = makeSession('action-detail-confirm', {
        actionDetail: '行動詳細テキスト',
      });
      const event = postbackEvent(
        buildPostbackData({ action: ACTION_SELECT_ACTION, value: 'stay' })
      );

      const result = await handler.handle(session, event);

      expect(
        (result.replyMessages[0] as { text: string }).text
      ).toContain('行動詳細テキスト');
    });
  });
});
