/**
 * AI獣害通報ページの型定義
 */

import {
  ANIMAL_TYPES,
  type AnimalTypeValue,
  getAnimalTypeLabel,
} from '@/server/domain/constants/animalTypes';

// 共通定数から型を再エクスポート
export type { AnimalTypeValue };

/**
 * シミュレーションのステップ
 */
export type SimulationStep =
  | 'initial' // 初期状態
  | 'animal-type' // Step1: 動物種選択
  | 'photo' // Step2: 写真アップロード
  | 'image-description' // Step3a: AI解析結果選択（写真あり）
  | 'situation' // Step3b: 状況自由入力（写真なし）
  | 'action-category' // Step3c: 行動カテゴリ選択
  | 'action-question' // Step3d: 行動詳細深掘り質問
  | 'action-detail-confirm' // Step3e: 行動詳細確認
  | 'datetime' // Step4: 日時入力
  | 'location' // Step5: 位置選択
  | 'confirm' // Step6: 確認
  | 'phone-number' // Step6b: 電話番号入力
  | 'complete'; // Step7: 完了

/**
 * ステップの情報
 */
export interface StepInfo {
  id: SimulationStep;
  label: string;
  order: number;
}

/**
 * すべてのステップ定義
 */
export const SIMULATION_STEPS: StepInfo[] = [
  { id: 'animal-type', label: '動物選択', order: 1 },
  { id: 'photo', label: '写真', order: 2 },
  { id: 'image-description', label: '状況', order: 3 },
  { id: 'situation', label: '状況', order: 3 },
  { id: 'datetime', label: '日時', order: 4 },
  { id: 'location', label: '位置', order: 5 },
  { id: 'confirm', label: '確認', order: 6 },
  { id: 'complete', label: '完了', order: 7 },
];

/**
 * 動物種のラベルマッピング
 * @deprecated getAnimalTypeLabel() を使用してください
 */
export const ANIMAL_TYPE_LABELS: Record<AnimalTypeValue, string> =
  Object.fromEntries(
    Object.keys(ANIMAL_TYPES).map((key) => [
      key,
      getAnimalTypeLabel(key as AnimalTypeValue),
    ])
  ) as Record<AnimalTypeValue, string>;

/**
 * AI解析結果（シミュレート用）
 */
export interface AIAnalysisResult {
  detectedAnimal: string | null;
  confidence: number;
  message: string;
}

/**
 * 位置情報
 */
export interface LocationData {
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
}

/**
 * 周辺ランドマーク情報
 *
 * アプリケーション層のDTOを再エクスポート
 */
export type { NearbyLandmarkDto as NearbyLandmark } from '@/server/application/dtos/NearbyLandmarkDto';

/**
 * シミュレーションで収集するデータ
 */
export interface SimulationData {
  animalType: AnimalTypeValue | null;
  photoUrl: string | null;
  aiAnalysis: AIAnalysisResult | null;
  location: LocationData | null;
  description: string;
}

/**
 * ボットメッセージの定義
 */
export const BOT_MESSAGES: Record<SimulationStep, string> = {
  initial: '獣害報告システムです。通報ありがとうございます。',
  'animal-type': 'どの動物の被害を受けましたか？',
  photo:
    '写真があると被害状況の確認に役立ちます。\n\n写真をアップロードしてください。写真がない場合はスキップできます。',
  'image-description': '写真を解析しました。状況を選択してください。',
  situation: '目撃した状況を教えてください。',
  'action-category': '動物の行動について詳しく教えてください。',
  'action-question': '以下の質問に答えてください。',
  'action-detail-confirm': '行動詳細を確認してください。',
  datetime: '目撃した日時を教えてください。',
  location:
    '被害が発生した場所を教えてください。\n\n地図上でピンを置いて位置を送信してください。',
  confirm:
    '入力内容を確認してください。\n\n内容に問題がなければ「送信」ボタンを押してください。',
  'phone-number':
    '通報をすぐ確認して欲しい場合は電話番号を入力してください。\n\nスキップすることもできます。',
  complete:
    '通報を受け付けました。ありがとうございます。\n\n担当者が確認次第、対応いたします。',
};
