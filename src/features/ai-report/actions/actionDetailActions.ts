'use server';

import { generateObject } from 'ai';
import { z } from 'zod';

import {
  geminiModel,
  modelConfig,
} from '@/server/infrastructure/ai/config/geminiConfig';
import type {
  ActionCategory,
  GenerateQuestionRequest,
  GenerateQuestionResult,
  GenerateAllQuestionsRequest,
  GenerateAllQuestionsResult,
  GenerateActionDetailRequest,
  GenerateActionDetailResult,
  QuestionAnswer,
  ACTION_CATEGORIES,
  QUESTION_PRIORITIES,
  QUESTION_ASPECTS,
} from '@/features/ai-report/types/actionDetail';
import { formatLocationWithLandmark } from '@/features/ai-report/utils/locationFormatter';

/**
 * 質問カードのスキーマ
 */
const questionCardSchema = z.object({
  questionText: z
    .string()
    .describe('質問文（1文、短く、日本語）'),
  choices: z
    .array(
      z.object({
        id: z.string().describe('選択肢ID（choice_1, choice_2, ...）'),
        label: z.string().describe('選択肢のラベル（短く具体的に）'),
      })
    )
    .min(2)
    .max(6)
    .describe('選択肢リスト（2〜6個）'),
  choiceType: z
    .enum(['single', 'multiple'])
    .describe('選択タイプ（single: 単一選択, multiple: 複数選択）'),
  allowOther: z
    .boolean()
    .describe('「その他（自由入力）」を許可するか'),
  rationale: z
    .string()
    .describe('この質問が必要な理由（ログ用）'),
  captureKey: z
    .string()
    .describe('回答を何として扱うか（direction, distance, targetなど）'),
  shouldContinue: z
    .boolean()
    .describe('この質問の後も追加質問が必要か'),
});

/**
 * カテゴリラベルを取得
 */
function getCategoryLabel(category: ActionCategory): string {
  const labels: Record<ActionCategory, string> = {
    movement: '移動',
    stay: '滞留',
    approach: '接近',
    feeding: '採食',
    threat: '威嚇',
    escape: '逃避',
    damage: '被害',
    other: 'その他',
  };
  return labels[category];
}

/**
 * 質問の優先観点を取得
 */
function getQuestionPriorities(category: ActionCategory): string[] {
  const priorities: Record<ActionCategory, string[]> = {
    movement: ['direction', 'speed', 'destination'],
    stay: ['duration', 'surroundings', 'reaction'],
    approach: ['target', 'distance', 'distanceChange'],
    feeding: ['foodType', 'location', 'duration'],
    threat: ['behavior', 'target', 'response'],
    escape: ['direction', 'trigger', 'speed'],
    damage: ['damageType', 'extent', 'location'],
    other: ['observation', 'behavior', 'surroundings'],
  };
  return priorities[category];
}

/**
 * 回答履歴をテキストに変換
 */
function formatAnswerHistory(answers: QuestionAnswer[]): string {
  if (answers.length === 0) return 'なし';

  return answers
    .map((a, i) => {
      const labels = a.selectedChoiceLabels.join('、');
      const other = a.otherText ? `、${a.otherText}` : '';
      return `Q${i + 1}: ${a.questionText}\nA${i + 1}: ${labels}${other}\n観点: ${a.captureKey}`;
    })
    .join('\n\n');
}

/**
 * 日時をフォーマット
 * サーバー側でもJSTで表示されるようtimeZoneを明示的に指定
 */
function formatDateTime(date: Date | undefined): string {
  if (!date) return '不明';
  return date.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 次の質問カードを生成
 */
export async function generateQuestion(
  request: GenerateQuestionRequest
): Promise<GenerateQuestionResult> {
  const { category, initialSituation, previousAnswers, questionNumber, dateTime, location } = request;

  // 最大3問で打ち止め
  if (questionNumber > 3) {
    return {
      success: true,
      question: null,
      skipReason: '最大質問数（3問）に達しました',
    };
  }

  const categoryLabel = getCategoryLabel(category);
  const priorities = getQuestionPriorities(category);
  const answeredKeys = previousAnswers.map((a) => a.captureKey);
  const remainingPriorities = priorities.filter((p) => !answeredKeys.includes(p));

  // 優先観点がすべて回答済みの場合
  if (remainingPriorities.length === 0 && questionNumber > 1) {
    return {
      success: true,
      question: null,
      skipReason: '必要な情報が揃いました',
    };
  }

  // 日時・場所のコンテキストを構築
  const contextParts: string[] = [];
  if (dateTime) {
    contextParts.push(`目撃日時: ${formatDateTime(dateTime)}`);
  }
  if (location) {
    contextParts.push(`目撃場所: ${formatLocationWithLandmark(location)}`);
  }
  const contextInfo = contextParts.length > 0 ? contextParts.join('\n') : 'なし';

  try {
    const result = await generateObject({
      model: geminiModel,
      schema: questionCardSchema,
      prompt: `あなたは野生動物目撃通報システムのAIアシスタントです。
通報者から「${categoryLabel}」に関する目撃情報の詳細を聞き取ります。

## 目撃情報
${contextInfo}

## 初期状況（通報者の入力）
${initialSituation || 'なし'}

## これまでの質問・回答
${formatAnswerHistory(previousAnswers)}

## 現在の質問番号
${questionNumber}問目（最大3問）

## このカテゴリで聞くべき観点（優先順）
${priorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## まだ聞いていない観点
${remainingPriorities.length > 0 ? remainingPriorities.join(', ') : 'なし'}

## タスク
上記の「まだ聞いていない観点」から最も重要なものを1つ選び、質問カードを生成してください。

## ルール
1. 質問文は1文、短く（20文字以内が理想）
2. 選択肢は最大6個
3. 必ず最後に「わからない」「覚えていない」などの選択肢を含める
4. 危険を煽る語彙禁止（「危険」「襲う」などの断定ワードは避ける）
5. 可能なら具体物に寄せる（「住宅」「ゴミ置き場」「畑」など）
6. 初期状況や目撃情報から明らかに判断できる内容は質問しない
7. shouldContinueは、まだ重要な情報が不足している場合にtrue
8. 各選択肢のlabelは先頭に内容を表す絵文字を1つ付ける（例: 「🏠 住宅」「🌾 畑」「❓ わからない」）

## 観点の説明
- direction: 移動方向（8方位/道路沿い/川沿い）
- speed: 移動速度（速い/普通/ゆっくり）
- destination: 行き先（山/住宅/道路）
- duration: 滞在時間（瞬間/数分/10分以上）
- surroundings: 周辺環境（ゴミ/畑/藪/住宅）
- reaction: 人への反応（変化した/しなかった）
- target: 接近対象（人/家/車/ペット/ゴミ/畑）
- distance: 距離感（近い/中/遠）
- distanceChange: 距離の変化（近づいた/離れた/変わらない）
- foodType: 食べ物の種類（農作物/ゴミ/野生）
- behavior: 威嚇行動（鳴き声/歯をむく）
- response: 相手の反応（逃げた/動かなかった）
- trigger: きっかけ（人を見て/音）
- damageType: 被害の種類（農作物/建物/車両）
- extent: 被害の程度（軽微/中程度/大きい）
- location: 場所（畑/庭/ゴミ置き場/道路）
- observation: 観察内容（見た/聞いた/痕跡）`,
      ...modelConfig,
    });

    const questionId = `q_${questionNumber}_${Date.now()}`;

    // 「わからない」選択肢が含まれていない場合は追加
    const choices = [...result.object.choices];
    const hasUnknown = choices.some(
      (c) =>
        c.label.includes('わからない') ||
        c.label.includes('覚えていない') ||
        c.label.includes('不明')
    );
    if (!hasUnknown) {
      choices.push({
        id: `choice_unknown`,
        label: 'わからない',
      });
    }

    return {
      success: true,
      question: {
        questionId,
        questionText: result.object.questionText,
        choices,
        choiceType: result.object.choiceType,
        allowOther: result.object.allowOther,
        allowUnknown: true, // 常にtrue
        rationale: result.object.rationale,
        captureKey: result.object.captureKey,
      },
    };
  } catch (error) {
    console.error('質問生成エラー:', error);
    return {
      success: false,
      question: null,
      error: error instanceof Error ? error.message : '質問の生成に失敗しました',
    };
  }
}

/**
 * 一括質問カードのスキーマ（1〜3問の配列）
 */
const allQuestionCardsSchema = z.object({
  questions: z
    .array(
      z.object({
        questionText: z
          .string()
          .describe('質問文（1文、短く、日本語）'),
        choices: z
          .array(
            z.object({
              id: z.string().describe('選択肢ID（choice_1, choice_2, ...）'),
              label: z.string().describe('選択肢のラベル（短く具体的に）'),
            })
          )
          .min(2)
          .max(6)
          .describe('選択肢リスト（2〜6個）'),
        choiceType: z
          .enum(['single', 'multiple'])
          .describe('選択タイプ（single: 単一選択, multiple: 複数選択）'),
        allowOther: z
          .boolean()
          .describe('「その他（自由入力）」を許可するか'),
        rationale: z
          .string()
          .describe('この質問が必要な理由（ログ用）'),
        captureKey: z
          .string()
          .describe('回答を何として扱うか（direction, distance, targetなど）'),
      })
    )
    .min(1)
    .max(3)
    .describe('質問カードのリスト（1〜3問）'),
});

/**
 * 最大3問の質問を1回のAI呼び出しで一括生成
 */
export async function generateAllQuestions(
  request: GenerateAllQuestionsRequest
): Promise<GenerateAllQuestionsResult> {
  const { category, initialSituation, dateTime, location } = request;

  const categoryLabel = getCategoryLabel(category);
  const priorities = getQuestionPriorities(category);

  // 日時・場所のコンテキストを構築
  const contextParts: string[] = [];
  if (dateTime) {
    contextParts.push(`目撃日時: ${formatDateTime(dateTime)}`);
  }
  if (location) {
    contextParts.push(`目撃場所: ${formatLocationWithLandmark(location)}`);
  }
  const contextInfo = contextParts.length > 0 ? contextParts.join('\n') : 'なし';

  try {
    const result = await generateObject({
      model: geminiModel,
      schema: allQuestionCardsSchema,
      prompt: `あなたは野生動物目撃通報システムのAIアシスタントです。
通報者から「${categoryLabel}」に関する目撃情報の詳細を聞き取ります。

## 目撃情報
${contextInfo}

## 初期状況（通報者の入力）
${initialSituation || 'なし'}

## このカテゴリで聞くべき観点（優先順）
${priorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## タスク
上記の観点から最も重要なものを最大3つ選び、それぞれに対応する質問カードを一括で生成してください。

## ルール
1. 各質問は異なるcaptureKeyを対象にすること（重複禁止）
2. 質問文は1文、短く（20文字以内が理想）
3. 選択肢は最大6個
4. 必ず最後に「わからない」「覚えていない」などの選択肢を含める
5. 危険を煽る語彙禁止（「危険」「襲う」などの断定ワードは避ける）
6. 可能なら具体物に寄せる（「住宅」「ゴミ置き場」「畑」など）
7. 初期状況や目撃情報から明らかに判断できる内容は質問しない
8. 質問の順番は重要度順にする
9. 初期状況から十分に情報が得られている場合は、質問数を減らしてよい
10. 各選択肢のlabelは先頭に内容を表す絵文字を1つ付ける（例: 「🏠 住宅」「🌾 畑」「❓ わからない」）

## 観点の説明
- direction: 移動方向（8方位/道路沿い/川沿い）
- speed: 移動速度（速い/普通/ゆっくり）
- destination: 行き先（山/住宅/道路）
- duration: 滞在時間（瞬間/数分/10分以上）
- surroundings: 周辺環境（ゴミ/畑/藪/住宅）
- reaction: 人への反応（変化した/しなかった）
- target: 接近対象（人/家/車/ペット/ゴミ/畑）
- distance: 距離感（近い/中/遠）
- distanceChange: 距離の変化（近づいた/離れた/変わらない）
- foodType: 食べ物の種類（農作物/ゴミ/野生）
- behavior: 威嚇行動（鳴き声/歯をむく）
- response: 相手の反応（逃げた/動かなかった）
- trigger: きっかけ（人を見て/音）
- damageType: 被害の種類（農作物/建物/車両）
- extent: 被害の程度（軽微/中程度/大きい）
- location: 場所（畑/庭/ゴミ置き場/道路）
- observation: 観察内容（見た/聞いた/痕跡）`,
      ...modelConfig,
    });

    const questions = result.object.questions.map((q, index) => {
      const questionId = `q_${index + 1}_${Date.now()}`;

      // 「わからない」選択肢が含まれていない場合は追加
      const choices = [...q.choices];
      const hasUnknown = choices.some(
        (c) =>
          c.label.includes('わからない') ||
          c.label.includes('覚えていない') ||
          c.label.includes('不明')
      );
      if (!hasUnknown) {
        choices.push({
          id: 'choice_unknown',
          label: 'わからない',
        });
      }

      return {
        questionId,
        questionText: q.questionText,
        choices,
        choiceType: q.choiceType as 'single' | 'multiple',
        allowOther: q.allowOther,
        allowUnknown: true,
        rationale: q.rationale,
        captureKey: q.captureKey,
      };
    });

    if (questions.length === 0) {
      return {
        success: true,
        questions: [],
        skipReason: '質問は不要と判断しました',
      };
    }

    return {
      success: true,
      questions,
    };
  } catch (error) {
    console.error('一括質問生成エラー:', error);
    return {
      success: false,
      questions: [],
      error: error instanceof Error ? error.message : '質問の生成に失敗しました',
    };
  }
}

/**
 * 行動詳細のスキーマ
 */
const actionDetailSchema = z.object({
  detail: z
    .string()
    .describe('行動詳細の自然文（1〜2文、観測ベース、断定禁止）'),
});

/**
 * 行動詳細（自然文）を生成
 */
export async function generateActionDetail(
  request: GenerateActionDetailRequest
): Promise<GenerateActionDetailResult> {
  const { category, initialSituation, questionAnswers, dateTime, location } = request;
  const categoryLabel = getCategoryLabel(category);

  // 日時・場所のコンテキストを構築
  const contextParts: string[] = [];
  if (dateTime) {
    contextParts.push(`目撃日時: ${formatDateTime(dateTime)}`);
  }
  if (location) {
    contextParts.push(`目撃場所: ${formatLocationWithLandmark(location)}`);
  }
  const contextInfo = contextParts.length > 0 ? contextParts.join('\n') : 'なし';

  try {
    const result = await generateObject({
      model: geminiModel,
      schema: actionDetailSchema,
      prompt: `あなたは野生動物目撃通報システムのAIアシスタントです。
通報者から聞き取った情報をもとに、行動詳細を自然な文章で作成してください。

## 行動カテゴリ
${categoryLabel}

## 目撃情報
${contextInfo}

## 初期状況（通報者の入力）
${initialSituation || 'なし'}

## 聞き取り結果
${formatAnswerHistory(questionAnswers)}

## タスク
上記の情報を元に、行動詳細を1〜2文の自然な文章で作成してください。

## ルール（厳守）
1. 1〜2文まで（長くならない）
2. 観測ベース（「見た」「聞いた」「〜のように見えた」など根拠語を入れる）
3. 断定禁止（不確実なら「〜のように見えた」「〜の可能性がある」）
4. 評価語禁止（「危険」「恐怖」「最悪」などは使わない）
5. 「わからない」「不明」の回答は無視して、わかっている情報だけで文章を作る
6. 動物の種類は含めない（別途管理されるため）
7. 時刻・場所は含めない（別途管理されるため）

## 良い例
- 「北東方向へゆっくり歩いて移動しているように見えた」
- 「畑の近くで立ち止まり、何かを食べている様子だった」
- 「人の姿を見て、山の方向へ走り去った」

## 悪い例
- 「危険な状態で接近してきた」（評価語を使っている）
- 「確実に攻撃しようとしていた」（断定している）
- 「イノシシが14時頃に東京駅付近で...」（動物種・時刻・場所を含んでいる）`,
      ...modelConfig,
    });

    return {
      success: true,
      detail: result.object.detail,
    };
  } catch (error) {
    console.error('行動詳細生成エラー:', error);
    return {
      success: false,
      detail: null,
      error:
        error instanceof Error ? error.message : '行動詳細の生成に失敗しました',
    };
  }
}

/**
 * 行動詳細を修正（ユーザーからの指摘を反映）
 */
export async function regenerateActionDetail(
  currentDetail: string,
  correction: string,
  category: ActionCategory
): Promise<GenerateActionDetailResult> {
  const categoryLabel = getCategoryLabel(category);

  try {
    const result = await generateObject({
      model: geminiModel,
      schema: actionDetailSchema,
      prompt: `現在の行動詳細:
「${currentDetail}」

カテゴリ: ${categoryLabel}

ユーザーからの修正指摘:
「${correction}」

上記の修正指摘を反映して、行動詳細を更新してください。

## ルール（厳守）
1. 1〜2文まで
2. 観測ベース（「見た」「聞いた」「〜のように見えた」など）
3. 断定禁止（「〜のように見えた」「〜の可能性がある」）
4. 評価語禁止（「危険」「恐怖」「最悪」などは使わない）
5. 動物の種類・時刻・場所は含めない`,
      ...modelConfig,
    });

    return {
      success: true,
      detail: result.object.detail,
    };
  } catch (error) {
    console.error('行動詳細再生成エラー:', error);
    return {
      success: false,
      detail: null,
      error:
        error instanceof Error ? error.message : '行動詳細の修正に失敗しました',
    };
  }
}
