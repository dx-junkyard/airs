import type { AnimalTypeValue } from '@/features/ai-report/types';
import type {
  ActionCategory,
  QuestionAnswer,
  QuestionCard,
} from '@/features/ai-report/types/actionDetail';
import type { ReportDraft } from '@/features/ai-report/types/chat';
import type { NearbyLandmark } from '@/features/ai-report/types';
import type { ReportImage } from '@/server/domain/value-objects/ImageUrls';
/**
 * LINE Botセッション状態
 *
 * 会話フローの中間データをすべて保持する
 */
export interface LineSessionState {
  // Step 1: 動物種
  animalType: AnimalTypeValue | null;

  // Step 2: 写真
  images: ReportImage[];

  // Step 2a: AI解析結果の解説（一時保持）
  imageAnalysisDescription: string | null;
  /** スクリーニング不合格回数 */
  imageRejectionCount: number;

  // Step 3: 状況説明
  situation: string;

  // Step 3c-3e: 行動詳細深掘り
  actionCategory: ActionCategory | null;
  actionQuestionAnswers: QuestionAnswer[];
  actionQuestionCount: number;
  /** 現在表示中の質問カード（回答時にコンテキストを構築するため保持） */
  currentQuestion: QuestionCard | null;
  /** 一括生成された質問のキュー（Q2, Q3...） */
  questionQueue: QuestionCard[];
  actionDetail: string | null;

  // Step 4: 日時
  dateTime: string | null; // ISO 8601文字列（JSONシリアライズ対応）

  // Step 5: 位置
  location: {
    latitude: number;
    longitude: number;
    address: string;
    landmarkName?: string;
    normalizedAddress?: {
      prefecture: string;
      city: string;
      oaza: string;
      aza: string;
      detail: string;
      full: string;
      areaKey: string;
      houseNumber?: string;
    };
  } | null;
  nearbyLandmarks: NearbyLandmark[] | null;

  // Step 6: 通報ドラフト
  reportDraft: ReportDraft | null;

  // Step 6b: 電話番号
  phoneNumber: string | null;
}

/**
 * 初期セッション状態を生成
 */
export function createInitialSessionState(): LineSessionState {
  return {
    animalType: null,
    images: [],
    imageAnalysisDescription: null,
    imageRejectionCount: 0,
    situation: '',
    actionCategory: null,
    actionQuestionAnswers: [],
    actionQuestionCount: 0,
    currentQuestion: null,
    questionQueue: [],
    actionDetail: null,
    dateTime: null,
    location: null,
    nearbyLandmarks: null,
    reportDraft: null,
    phoneNumber: null,
  };
}
