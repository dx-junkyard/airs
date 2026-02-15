import { atom } from 'jotai';
import type {
  SimulationStep,
  AnimalTypeValue,
  AIAnalysisResult,
  LocationData,
} from '@/features/ai-report/types';
import type { ReportDraft } from '@/features/ai-report/types/chat';
import { generatedActionDetailAtom } from '@/features/ai-report/atoms/actionDetailAtoms';

/**
 * 現在のシミュレーションステップ
 */
export const currentStepAtom = atom<SimulationStep>('animal-type');

/**
 * 選択された動物種
 */
export const selectedAnimalTypeAtom = atom<AnimalTypeValue | null>(null);

/**
 * アップロードされた写真URL（複数枚対応）
 */
export const uploadedPhotoUrlsAtom = atom<string[]>([]);

/**
 * 写真アップロード試行回数（最大3回）
 */
export const photoUploadCountAtom = atom<number>(0);

/**
 * 各画像から取得した解説テキスト（レポート生成の材料に使用）
 */
export const collectedImageDescriptionsAtom = atom<string[]>([]);

/**
 * 選択された画像解説
 */
export const selectedImageDescriptionAtom = atom<string | null>(null);

/**
 * AI解析結果（シミュレート）
 */
export const aiAnalysisResultAtom = atom<AIAnalysisResult | null>(null);

/**
 * 選択された位置情報
 */
export const selectedLocationAtom = atom<LocationData | null>(null);

/**
 * 説明文
 */
export const descriptionAtom = atom<string>('');

/**
 * 目撃日時（初期値: 現在時刻）
 */
export const reportDateTimeAtom = atom<Date>(new Date());

/**
 * 状況説明（写真なし時の自由入力）
 */
export const situationDescriptionAtom = atom<string>('');

/**
 * 生成されたレポート案
 */
export const reportDraftAtom = atom<ReportDraft | null>(null);

/**
 * 処理中フラグ
 */
export const isProcessingAtom = atom<boolean>(false);

/**
 * 電話番号（任意入力）
 */
export const phoneNumberAtom = atom<string>('');

/**
 * 送信完了後のレポートID
 */
export const reportIdAtom = atom<string | undefined>(undefined);

/**
 * 送信完了後のレポートトークン（JWT）
 */
export const reportTokenAtom = atom<string | undefined>(undefined);

/**
 * すべての入力データを取得する派生atom
 */
export const simulationDataAtom = atom((get) => ({
  animalType: get(selectedAnimalTypeAtom),
  photoUrls: get(uploadedPhotoUrlsAtom),
  imageDescription: get(selectedImageDescriptionAtom),
  aiAnalysis: get(aiAnalysisResultAtom),
  location: get(selectedLocationAtom),
  description: get(descriptionAtom),
  dateTime: get(reportDateTimeAtom),
  situationDescription: get(situationDescriptionAtom),
  reportDraft: get(reportDraftAtom),
  phoneNumber: get(phoneNumberAtom),
}));

/**
 * 状況テキスト（画像解析結果 + 行動詳細を結合）
 * - 画像解析の説明（選択肢から選んだ内容）
 * - 行動詳細深掘りAIで生成された自然文
 */
export const situationTextAtom = atom((get) => {
  const imageDescription = get(selectedImageDescriptionAtom);
  const collectedDescriptions = get(collectedImageDescriptionsAtom);
  const situationDescription = get(situationDescriptionAtom);
  const actionDetail = get(generatedActionDetailAtom);

  // 各要素を配列に集めて、存在するものだけ結合
  const parts: string[] = [];

  // 画像解析結果または状況説明
  if (situationDescription) {
    parts.push(situationDescription);
  } else if (imageDescription) {
    parts.push(imageDescription);
  }

  // 他の画像から取得した解説（選択された解説と重複しないものを追加）
  for (const desc of collectedDescriptions) {
    if (desc !== imageDescription && desc !== situationDescription) {
      parts.push(desc);
    }
  }

  // 行動詳細（Q&Aから生成）
  if (actionDetail) {
    parts.push(actionDetail);
  }

  return parts.join('\n');
});

/**
 * フォームが有効かどうかをチェックする派生atom
 */
export const isFormValidAtom = atom((get) => {
  const animalType = get(selectedAnimalTypeAtom);
  const location = get(selectedLocationAtom);

  // 最低限必要: 動物種と位置情報
  return animalType !== null && location !== null;
});

/**
 * すべての状態をリセットするアクションatom
 */
export const resetSimulationAtom = atom(null, (get, set) => {
  set(currentStepAtom, 'animal-type');
  set(selectedAnimalTypeAtom, null);
  set(uploadedPhotoUrlsAtom, []);
  set(photoUploadCountAtom, 0);
  set(collectedImageDescriptionsAtom, []);
  set(selectedImageDescriptionAtom, null);
  set(aiAnalysisResultAtom, null);
  set(selectedLocationAtom, null);
  set(descriptionAtom, '');
  set(reportDateTimeAtom, new Date());
  set(situationDescriptionAtom, '');
  set(reportDraftAtom, null);
  set(isProcessingAtom, false);
  set(phoneNumberAtom, '');
  set(reportIdAtom, undefined);
  set(reportTokenAtom, undefined);
});
