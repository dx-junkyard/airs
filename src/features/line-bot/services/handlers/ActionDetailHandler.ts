import type { messagingApi } from '@line/bot-sdk';

import type {
  ActionCategory,
  QuestionAnswer,
  QuestionCard,
} from '@/features/ai-report/types/actionDetail';
import type {
  LineEventInput,
  LineResponseMessages,
} from '@/features/line-bot/types/lineMessages';
import type { LineSessionState } from '@/features/line-bot/types/lineSession';
import type {
  ILineSessionRepository,
  LineSessionData,
} from '@/server/domain/repositories/ILineSessionRepository';
import { parsePostbackData } from '@/features/line-bot/utils/postbackParser';
import {
  ACTION_SELECT_ACTION,
  ACTION_ANSWER_QUESTION,
  ACTION_CONFIRM_DETAIL,
  ACTION_RESTART_DETAIL,
} from '@/features/line-bot/constants/postbackActions';
import {
  buildActionCategoryMessages,
  buildQuestionMessage,
  buildActionDetailConfirmMessage,
  buildDraftGeneratingMessage,
  buildReportDraftMessage,
  textMessage,
} from '@/features/line-bot/services/LineMessageBuilder';
import {
  generateQuestion,
  generateAllQuestions,
  generateActionDetail,
} from '@/features/ai-report/actions/actionDetailActions';
import { generateReportDraft } from '@/features/ai-report/actions';
import type { ReportDraft } from '@/features/ai-report/types/chat';
import { getAnimalTypeLabel } from '@/server/domain/constants/animalTypes';
import { formatLocationWithLandmark } from '@/features/ai-report/utils/locationFormatter';
import type { IStepHandler } from '@/features/line-bot/services/handlers/IStepHandler';

/**
 * Step 3c-3e: 行動カテゴリ・質問・詳細確認ハンドラー
 */
class ActionDetailHandler implements IStepHandler {
  constructor(private sessionRepo: ILineSessionRepository) {}

  async handle(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages> {
    const { step } = session;

    switch (step) {
      case 'action-category':
        return this.handleActionCategory(session, event);
      case 'action-question':
        return this.handleActionQuestion(session, event);
      case 'action-detail-confirm':
        return this.handleActionDetailConfirm(session, event);
      default:
        return { replyMessages: buildActionCategoryMessages() };
    }
  }

  /**
   * Step 3c: 行動カテゴリ選択
   */
  private async handleActionCategory(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages> {
    if (event.type !== 'postback' || !event.postbackData) {
      return { replyMessages: buildActionCategoryMessages() };
    }

    const payload = parsePostbackData(event.postbackData);
    if (payload.action !== ACTION_SELECT_ACTION || !payload.value) {
      return { replyMessages: buildActionCategoryMessages() };
    }

    const actionCategory = payload.value as ActionCategory;
    const newState: LineSessionState = {
      ...session.state,
      actionCategory,
      actionQuestionAnswers: [],
      actionQuestionCount: 0,
      currentQuestion: null,
      questionQueue: [],
    };
    await this.sessionRepo.save(
      session.lineUserId,
      'action-question',
      newState
    );

    const replyMessages = await this.generateAndSendAllQuestions(
      session.lineUserId,
      newState
    );
    return { replyMessages };
  }

  /**
   * 全質問を一括生成してQ1を返す（Q2以降はキューに保存）
   */
  private async generateAndSendAllQuestions(
    lineUserId: string,
    state: LineSessionState
  ): Promise<messagingApi.Message[]> {
    try {
      const result = await generateAllQuestions({
        category: state.actionCategory!,
        initialSituation: state.situation,
        dateTime: state.dateTime ? new Date(state.dateTime) : undefined,
        location: state.location ?? undefined,
      });

      if (!result.success || result.questions.length === 0) {
        return this.generateAndSendActionDetail(lineUserId, state);
      }

      const [firstQuestion, ...remainingQuestions] = result.questions;
      const newState: LineSessionState = {
        ...state,
        actionQuestionCount: 1,
        currentQuestion: firstQuestion,
        questionQueue: remainingQuestions,
      };
      await this.sessionRepo.save(lineUserId, 'action-question', newState);

      return [buildQuestionMessage(firstQuestion)];
    } catch (error) {
      console.error('All questions generation error:', error);
      return this.generateAndSendActionDetail(lineUserId, state);
    }
  }

  /**
   * 質問を生成して返す（フォールバック用、キューが空の場合に使用）
   */
  private async generateAndSendQuestion(
    lineUserId: string,
    state: LineSessionState
  ): Promise<messagingApi.Message[]> {
    try {
      const result = await generateQuestion({
        category: state.actionCategory!,
        initialSituation: state.situation,
        previousAnswers: state.actionQuestionAnswers,
        questionNumber: state.actionQuestionCount + 1,
        dateTime: state.dateTime ? new Date(state.dateTime) : undefined,
        location: state.location ?? undefined,
      });

      if (!result.success || !result.question) {
        return this.generateAndSendActionDetail(lineUserId, state);
      }

      const newState: LineSessionState = {
        ...state,
        actionQuestionCount: state.actionQuestionCount + 1,
        currentQuestion: result.question,
      };
      await this.sessionRepo.save(lineUserId, 'action-question', newState);

      return [buildQuestionMessage(result.question)];
    } catch (error) {
      console.error('Question generation error:', error);
      return this.generateAndSendActionDetail(lineUserId, state);
    }
  }

  /**
   * 行動詳細を生成して返す
   */
  private async generateAndSendActionDetail(
    lineUserId: string,
    state: LineSessionState
  ): Promise<messagingApi.Message[]> {
    try {
      const result = await generateActionDetail({
        category: state.actionCategory!,
        initialSituation: state.situation,
        questionAnswers: state.actionQuestionAnswers,
        dateTime: state.dateTime ? new Date(state.dateTime) : undefined,
        location: state.location ?? undefined,
      });

      if (!result.success || !result.detail) {
        const newState: LineSessionState = {
          ...state,
          actionDetail: state.situation,
        };
        await this.sessionRepo.save(
          lineUserId,
          'action-detail-confirm',
          newState
        );
        return [buildActionDetailConfirmMessage(state.situation)];
      }

      const newState: LineSessionState = {
        ...state,
        actionDetail: result.detail,
      };
      await this.sessionRepo.save(
        lineUserId,
        'action-detail-confirm',
        newState
      );
      return [buildActionDetailConfirmMessage(result.detail)];
    } catch (error) {
      console.error('Action detail generation error:', error);
      const newState: LineSessionState = {
        ...state,
        actionDetail: state.situation,
      };
      await this.sessionRepo.save(
        lineUserId,
        'action-detail-confirm',
        newState
      );
      return [buildActionDetailConfirmMessage(state.situation)];
    }
  }

  /**
   * Step 3d: 行動詳細質問
   */
  private async handleActionQuestion(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages> {
    if (event.type !== 'postback' || !event.postbackData) {
      return {
        replyMessages: [textMessage('質問の回答をボタンで選択してください。')],
      };
    }

    const payload = parsePostbackData(event.postbackData);
    if (payload.action !== ACTION_ANSWER_QUESTION) {
      return {
        replyMessages: [textMessage('質問の回答をボタンで選択してください。')],
      };
    }

    const currentQ: QuestionCard | null = session.state.currentQuestion;
    const selectedChoiceId = payload.cid || '';
    const selectedChoiceLabel =
      currentQ?.choices.find((c) => c.id === selectedChoiceId)?.label ||
      selectedChoiceId;

    const answer: QuestionAnswer = {
      questionId: payload.qid || currentQ?.questionId || '',
      questionText: currentQ?.questionText || '',
      selectedChoiceIds: [selectedChoiceId],
      selectedChoiceLabels: [selectedChoiceLabel],
      captureKey: currentQ?.captureKey || '',
    };

    const newAnswers = [...session.state.actionQuestionAnswers, answer];
    const queue = session.state.questionQueue;
    const lineUserId = session.lineUserId;

    // キューに次の質問がある場合は即座に返す
    if (queue.length > 0) {
      const [nextQuestion, ...remainingQueue] = queue;
      const newState: LineSessionState = {
        ...session.state,
        actionQuestionAnswers: newAnswers,
        actionQuestionCount: session.state.actionQuestionCount + 1,
        currentQuestion: nextQuestion,
        questionQueue: remainingQueue,
      };
      await this.sessionRepo.save(lineUserId, 'action-question', newState);

      return {
        replyMessages: [buildQuestionMessage(nextQuestion)],
      };
    }

    // キューが空 → 行動詳細生成
    const newState: LineSessionState = {
      ...session.state,
      actionQuestionAnswers: newAnswers,
      currentQuestion: null,
      questionQueue: [],
    };

    return {
      replyMessages: await this.generateAndSendActionDetail(
        lineUserId,
        newState
      ),
    };
  }

  /**
   * Step 3e: 行動詳細確認
   */
  private async handleActionDetailConfirm(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages> {
    // テキストメッセージ → 確認画面を再表示
    if (event.type === 'message' && event.text) {
      if (session.state.actionDetail) {
        return {
          replyMessages: [
            buildActionDetailConfirmMessage(session.state.actionDetail),
          ],
        };
      }
      return {
        replyMessages: [textMessage('行動詳細を確認してください。')],
      };
    }

    if (event.type !== 'postback' || !event.postbackData) {
      if (session.state.actionDetail) {
        return {
          replyMessages: [
            buildActionDetailConfirmMessage(session.state.actionDetail),
          ],
        };
      }
      return {
        replyMessages: [textMessage('行動詳細を確認してください。')],
      };
    }

    const payload = parsePostbackData(event.postbackData);

    if (payload.action === ACTION_CONFIRM_DETAIL) {
      const newState: LineSessionState = {
        ...session.state,
        situation: session.state.actionDetail || session.state.situation,
      };
      await this.sessionRepo.save(session.lineUserId, 'confirm', newState);
      return {
        replyMessages: [
          buildDraftGeneratingMessage(),
          ...(await this.generateDraft(session.lineUserId, newState)),
        ],
      };
    }

    if (payload.action === ACTION_RESTART_DETAIL) {
      const newState: LineSessionState = {
        ...session.state,
        actionCategory: null,
        actionQuestionAnswers: [],
        actionQuestionCount: 0,
        currentQuestion: null,
        questionQueue: [],
        actionDetail: null,
      };
      await this.sessionRepo.save(
        session.lineUserId,
        'action-category',
        newState
      );
      return {
        replyMessages: buildActionCategoryMessages(),
      };
    }

    return {
      replyMessages: [
        buildActionDetailConfirmMessage(
          session.state.actionDetail || session.state.situation
        ),
      ],
    };
  }

  /**
   * ドラフトを生成して返す
   */
  private async generateDraft(
    lineUserId: string,
    state: LineSessionState
  ): Promise<messagingApi.Message[]> {
    try {
      const draft = await generateReportDraft({
        animalType: state.animalType!,
        situation: state.situation,
        dateTime: new Date(state.dateTime!),
        location: state.location!,
      });

      const newState: LineSessionState = {
        ...state,
        reportDraft: draft,
      };
      await this.sessionRepo.save(lineUserId, 'confirm', newState);

      return [buildReportDraftMessage(draft)];
    } catch (error) {
      console.error('Draft generation error:', error);
      const draft: ReportDraft = {
        when: state.dateTime
          ? new Date(state.dateTime).toLocaleString('ja-JP', {
              timeZone: 'Asia/Tokyo',
            })
          : '不明',
        where: formatLocationWithLandmark(state.location) || '不明',
        what: getAnimalTypeLabel(state.animalType!),
        situation: state.situation,
      };
      const newState: LineSessionState = {
        ...state,
        reportDraft: draft,
      };
      await this.sessionRepo.save(lineUserId, 'confirm', newState);
      return [buildReportDraftMessage(draft)];
    }
  }
}

export default ActionDetailHandler;
