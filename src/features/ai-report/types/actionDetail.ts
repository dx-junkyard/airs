/**
 * 行動詳細深掘りAI機能の型定義
 */

/**
 * 行動カテゴリ（静的）
 * 集計・フィルタに使用する
 */
export type ActionCategory =
  | 'movement' // 移動
  | 'stay' // 滞留
  | 'approach' // 接近
  | 'feeding' // 採食
  | 'threat' // 威嚇
  | 'escape' // 逃避
  | 'damage' // 被害（農作物・物品）
  | 'other'; // その他・不明

/**
 * 行動カテゴリの定義
 */
export interface ActionCategoryInfo {
  id: ActionCategory;
  label: string;
  description: string;
  icon: string;
}

/**
 * 行動カテゴリ一覧
 */
export const ACTION_CATEGORIES: ActionCategoryInfo[] = [
  {
    id: 'movement',
    label: '移動',
    description: '通過・歩行など移動していた',
    icon: 'movement',
  },
  {
    id: 'stay',
    label: '滞留',
    description: 'その場に留まっていた',
    icon: 'stay',
  },
  {
    id: 'approach',
    label: '接近',
    description: '人や建物に近づいてきた',
    icon: 'approach',
  },
  {
    id: 'feeding',
    label: '採食',
    description: '何かを食べていた',
    icon: 'feeding',
  },
  {
    id: 'threat',
    label: '威嚇',
    description: '威嚇行動をとった',
    icon: 'threat',
  },
  {
    id: 'escape',
    label: '逃避',
    description: '逃げていった',
    icon: 'escape',
  },
  {
    id: 'damage',
    label: '被害',
    description: '農作物・物品の被害',
    icon: 'damage',
  },
  {
    id: 'other',
    label: 'その他',
    description: '上記以外・わからない',
    icon: 'other',
  },
];

/**
 * 質問の選択肢タイプ
 */
export type ChoiceType = 'single' | 'multiple';

/**
 * 質問カードの選択肢
 */
export interface QuestionChoice {
  id: string;
  label: string;
}

/**
 * 質問カード（AIが生成）
 */
export interface QuestionCard {
  /** 質問ID */
  questionId: string;
  /** 質問文（1文、短く） */
  questionText: string;
  /** 選択肢リスト（最大6個） */
  choices: QuestionChoice[];
  /** 選択タイプ */
  choiceType: ChoiceType;
  /** 「その他（自由入力）」を許すか */
  allowOther: boolean;
  /** 「わからない」を必ず用意（原則true） */
  allowUnknown: boolean;
  /** なぜこの質問が必要か（ログ用、UIには出さない） */
  rationale: string;
  /** 回答を何として扱うか */
  captureKey: string;
}

/**
 * 質問への回答
 */
export interface QuestionAnswer {
  /** 質問ID */
  questionId: string;
  /** 質問文（コンテキスト用） */
  questionText: string;
  /** 選択した選択肢のID（複数可能） */
  selectedChoiceIds: string[];
  /** 選択した選択肢のラベル（コンテキスト用） */
  selectedChoiceLabels: string[];
  /** 「その他」の自由入力テキスト */
  otherText?: string;
  /** 回答を何として扱うか（質問カードからコピー） */
  captureKey: string;
}

/**
 * 深掘りフローの状態
 */
export interface ActionDetailFlowState {
  /** 選択された行動カテゴリ */
  category: ActionCategory | null;
  /** 質問・回答の履歴 */
  questionAnswers: QuestionAnswer[];
  /** 現在の質問カード（表示中） */
  currentQuestion: QuestionCard | null;
  /** 質問回数 */
  questionCount: number;
  /** 最大質問数 */
  maxQuestions: number;
  /** 生成された行動詳細（自然文） */
  generatedDetail: string | null;
  /** フロー完了フラグ */
  isComplete: boolean;
}

/**
 * 質問生成リクエスト
 */
export interface GenerateQuestionRequest {
  /** 行動カテゴリ */
  category: ActionCategory;
  /** 初期状況（ユーザー入力） */
  initialSituation: string;
  /** これまでの質問・回答履歴 */
  previousAnswers: QuestionAnswer[];
  /** 質問番号（1から開始） */
  questionNumber: number;
  /** 目撃日時 */
  dateTime?: Date;
  /** 目撃場所 */
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

/**
 * 質問生成結果
 */
export interface GenerateQuestionResult {
  success: boolean;
  /** 次の質問カード（null = これ以上質問不要） */
  question: QuestionCard | null;
  /** 質問が不要と判断した理由（question=nullの場合） */
  skipReason?: string;
  error?: string;
}

/**
 * 一括質問生成リクエスト
 */
export interface GenerateAllQuestionsRequest {
  /** 行動カテゴリ */
  category: ActionCategory;
  /** 初期状況（ユーザー入力） */
  initialSituation: string;
  /** 目撃日時 */
  dateTime?: Date;
  /** 目撃場所 */
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

/**
 * 一括質問生成結果
 */
export interface GenerateAllQuestionsResult {
  success: boolean;
  /** 生成された質問カード（最大3問） */
  questions: QuestionCard[];
  /** 質問が不要と判断した理由 */
  skipReason?: string;
  error?: string;
}

/**
 * 行動詳細（自然文）生成リクエスト
 */
export interface GenerateActionDetailRequest {
  /** 行動カテゴリ */
  category: ActionCategory;
  /** 初期状況（ユーザー入力） */
  initialSituation: string;
  /** 質問・回答の履歴 */
  questionAnswers: QuestionAnswer[];
  /** 目撃日時 */
  dateTime?: Date;
  /** 目撃場所 */
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

/**
 * 行動詳細（自然文）生成結果
 */
export interface GenerateActionDetailResult {
  success: boolean;
  /** 生成された自然文 */
  detail: string | null;
  error?: string;
}

/**
 * カテゴリごとの質問優先順位
 */
export const QUESTION_PRIORITIES: Record<ActionCategory, string[]> = {
  movement: ['direction', 'speed', 'destination'],
  stay: ['duration', 'surroundings', 'reaction'],
  approach: ['target', 'distance', 'distanceChange'],
  feeding: ['foodType', 'location', 'duration'],
  threat: ['behavior', 'target', 'response'],
  escape: ['direction', 'trigger', 'speed'],
  damage: ['damageType', 'extent', 'location'],
  other: ['observation', 'behavior', 'surroundings'],
};

/**
 * 観点プール（AIが質問を選ぶ際の候補）
 */
export const QUESTION_ASPECTS = {
  direction: '方向（8方位/道路沿い/川沿い/不明）',
  speed: '速度（速い/普通/ゆっくり/不明）',
  destination: '行き先（山/住宅/不明）',
  duration: '滞在時間（瞬間/数分/10分以上/不明）',
  surroundings: '周辺（ゴミ/畑/藪/住宅/不明）',
  reaction: '反応（人を見て変化した？/しなかった/不明）',
  target: '対象（人/家/車/ペット/ゴミ/畑/不明）',
  distance: '距離感（近い/中/遠/不明）',
  distanceChange: '距離の変化（近づいた/離れた/変わらない/不明）',
  foodType: '食べ物の種類（農作物/ゴミ/野生/不明）',
  behavior: '行動（鳴き声/歯をむく/飛びかかる姿勢/不明）',
  response: '相手の反応（逃げた/動かなかった/不明）',
  trigger: 'きっかけ（人を見て/音/不明）',
  damageType: '被害の種類（農作物/建物/車両/その他/不明）',
  extent: '被害の程度（軽微/中程度/大きい/不明）',
  location: '場所（畑/庭/ゴミ置き場/道路/不明）',
  observation: '観察内容（見た/聞いた/痕跡/不明）',
} as const;
