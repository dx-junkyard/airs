import { atom } from 'jotai';
import type {
  ActionCategory,
  QuestionCard,
  QuestionAnswer,
} from '@/features/ai-report/types/actionDetail';

/**
 * 選択された行動カテゴリ
 */
export const actionCategoryAtom = atom<ActionCategory | null>(null);

/**
 * 現在表示中の質問カード
 */
export const currentQuestionAtom = atom<QuestionCard | null>(null);

/**
 * 質問・回答の履歴
 */
export const questionAnswersAtom = atom<QuestionAnswer[]>([]);

/**
 * 現在の質問番号（1から開始）
 */
export const questionCountAtom = atom<number>(0);

/**
 * 最大質問数
 */
export const MAX_QUESTIONS = 3;

/**
 * 一括生成した全質問の不変リスト
 */
export const allGeneratedQuestionsAtom = atom<QuestionCard[]>([]);

/**
 * 次に表示すべき質問のインデックス
 */
export const nextQuestionIndexAtom = atom<number>(0);

/**
 * 生成された行動詳細（自然文）
 */
export const generatedActionDetailAtom = atom<string | null>(null);

/**
 * 深掘りフロー完了フラグ
 */
export const isActionDetailCompleteAtom = atom<boolean>(false);

/**
 * 深掘りフローの状態をまとめた派生atom
 */
export const actionDetailFlowStateAtom = atom((get) => ({
  category: get(actionCategoryAtom),
  currentQuestion: get(currentQuestionAtom),
  questionAnswers: get(questionAnswersAtom),
  questionCount: get(questionCountAtom),
  maxQuestions: MAX_QUESTIONS,
  generatedDetail: get(generatedActionDetailAtom),
  isComplete: get(isActionDetailCompleteAtom),
}));

/**
 * 深掘りフローをリセットするアクションatom
 */
export const resetActionDetailFlowAtom = atom(null, (get, set) => {
  set(actionCategoryAtom, null);
  set(currentQuestionAtom, null);
  set(questionAnswersAtom, []);
  set(questionCountAtom, 0);
  set(allGeneratedQuestionsAtom, []);
  set(nextQuestionIndexAtom, 0);
  set(generatedActionDetailAtom, null);
  set(isActionDetailCompleteAtom, false);
});

/**
 * 行動カテゴリを設定するアクションatom
 */
export const setActionCategoryAtom = atom(
  null,
  (get, set, category: ActionCategory) => {
    set(actionCategoryAtom, category);
    set(questionCountAtom, 1);
  }
);

/**
 * 質問への回答を追加するアクションatom
 */
export const addQuestionAnswerAtom = atom(
  null,
  (get, set, answer: QuestionAnswer) => {
    const currentAnswers = get(questionAnswersAtom);
    set(questionAnswersAtom, [...currentAnswers, answer]);
    set(questionCountAtom, get(questionCountAtom) + 1);
    set(currentQuestionAtom, null);
  }
);

/**
 * 次の質問を設定するアクションatom
 */
export const setNextQuestionAtom = atom(
  null,
  (get, set, question: QuestionCard | null) => {
    set(currentQuestionAtom, question);
  }
);

/**
 * 行動詳細を設定するアクションatom
 */
export const setGeneratedActionDetailAtom = atom(
  null,
  (get, set, detail: string) => {
    set(generatedActionDetailAtom, detail);
  }
);

/**
 * 深掘りフローを完了するアクションatom
 */
export const completeActionDetailFlowAtom = atom(null, (get, set) => {
  set(isActionDetailCompleteAtom, true);
});

/**
 * 最後の回答を削除して質問に戻るアクションatom（修正用）
 */
export const undoLastAnswerAtom = atom(null, (get, set) => {
  const currentAnswers = get(questionAnswersAtom);
  if (currentAnswers.length > 0) {
    set(questionAnswersAtom, currentAnswers.slice(0, -1));
    set(questionCountAtom, Math.max(1, get(questionCountAtom) - 1));
    set(generatedActionDetailAtom, null);
    set(isActionDetailCompleteAtom, false);
  }
});
