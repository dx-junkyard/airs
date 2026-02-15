'use server';

import { generateObject, generateText } from 'ai';
import { z } from 'zod';

import DIContainer from '@/server/infrastructure/di/container';
import ReverseGeocodeUseCase from '@/server/application/use-cases/geo/ReverseGeocodeUseCase';
import GetSystemSettingUseCase from '@/server/application/use-cases/system-setting/GetSystemSettingUseCase';
import SearchNearbyLandmarksUseCase from '@/server/application/use-cases/geo/SearchNearbyLandmarksUseCase';
import {
  codeExecutionTool,
  geminiModel,
  geminiVisionModel,
  visionProviderOptions,
  modelConfig,
} from '@/server/infrastructure/ai/config/geminiConfig';
import { getAnimalTypeLabel } from '@/server/domain/constants/animalTypes';
import type { StructuredAddress } from '@/server/domain/models/geo/StructuredAddressModel';
import type {
  AnimalTypeValue,
  LocationData,
  NearbyLandmark,
} from '@/features/ai-report/types';
import type { ReportDraft } from '@/features/ai-report/types/chat';
import { formatDateTime } from '@/features/ai-report/utils/reportFormatter';
import { formatLocationWithLandmark } from '@/features/ai-report/utils/locationFormatter';

/**
 * 画像アップロード結果
 */
export interface UploadImageResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 画像解析結果
 */
export interface ImageAnalysisResult {
  success: boolean;
  /** 画像が被写体を判別できる鮮明さか */
  isImageClear: boolean;
  /** 動物・痕跡・被害が写っているか */
  containsAnimalOrTrace: boolean;
  /** 検出された獣種コード（monkey, deer, wild_boar, bear, other） */
  detectedAnimalType?: string;
  /** 画像の解説文 */
  description?: string;
  error?: string;
}

/**
 * 画像をアップロードしてURLを取得
 *
 * @param formData アップロードする画像を含むFormData
 * @returns アップロード結果
 */
export async function uploadImage(
  formData: FormData
): Promise<UploadImageResult> {
  try {
    const file = formData.get('image') as File;
    if (!file) {
      return {
        success: false,
        error: '画像ファイルが指定されていません',
      };
    }

    const imageRepository = DIContainer.getImageRepository();
    const url = await imageRepository.upload(file, file.name);

    return { success: true, url };
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'アップロードに失敗しました',
    };
  }
}

/**
 * AI画像解析をシミュレート
 *
 * @param animalType 選択された獣種
 * @returns 解析結果メッセージ
 * @deprecated analyzeImageWithAI を使用してください
 */
export async function simulateAIAnalysis(animalType: string): Promise<string> {
  // シミュレートされた遅延
  await new Promise((resolve) => setTimeout(resolve, 500));

  const label = getAnimalTypeLabel(animalType) || '動物';
  return `画像を解析しました。${label}による被害の可能性があります。`;
}

/**
 * 画像解析プロンプト
 *
 * AIに総合判定させず、各観点をフラグとして出力させる。
 * 合否判定はコード側で行う。
 *
 * Agentic Vision（Code Execution）により、モデルが画像をズーム・クロップして
 * 能動的に分析するため、遠景や不鮮明な画像でも高精度な解析が可能。
 */
const VISION_ANALYSIS_PROMPT = `この画像を分析してください。野生動物（サル、シカ、イノシシ、クマなど）の目撃・被害通報システムで使用されます。

必要に応じて画像のズームインやクロップを行い、細部まで確認してください。

以下の各観点について個別に判定し、JSON形式で回答してください。
総合的な合否判定は不要です。各フラグを正確に設定してください。

■ isImageClear（画像鮮明フラグ）
被写体が判別できるかを判定してください。
- true: 何が写っているか判別できる（多少のブレ・暗さ・遠景は許容）
- false: 被写体が全く判別できない（真っ暗、完全にピンボケ等）
※通報者は現場でスマートフォンで撮影しているため、多少の画質の低さは許容してください

■ containsAnimalOrTrace（動物・痕跡フラグ）
以下のいずれかが写っているかを判定してください。
- 野生動物そのもの（サル、シカ、イノシシ、クマ等）
- 動物の痕跡（足跡、糞、爪痕、体毛）
- 動物による被害（食害、農作物被害、器物損壊）
※以下は false とする: 人物のみ、室内、風景のみ、スクリーンショット、ペット・家畜のみ

■ detectedAnimalType（検出獣種）
画像に動物が写っている場合、その種類を判定してください。
痕跡・被害のみで種類が特定できない場合は other としてください。

■ description（画像解説文）
50〜100文字程度で画像の内容を説明してください。

【回答フォーマット】
以下のJSON形式のみで回答してください。JSONの前後に説明文やマークダウンのコードブロックは付けないでください。

{"isImageClear": true/false, "containsAnimalOrTrace": true/false, "detectedAnimalType": "monkey|deer|wild_boar|bear|other", "description": "解説文"}

■ detectedAnimalType の値
- monkey: サル
- deer: シカ
- wild_boar: イノシシ
- bear: クマ
- other: 上記以外の動物、種類を特定できない、または動物が写っていない場合

■ description の書き方
- 動物が写っている場合: 種類、頭数、行動に加え、外見的特徴（顔の形、毛の色、体格、角の有無など）を含める
- 被害状況の場合: 被害の種類と程度を含める
- 痕跡の場合: 痕跡の種類と状態を含める
- 不鮮明・無関係な場合でも、見える範囲で何が写っているか簡潔に記述する`;

/**
 * 画像解析用Zodスキーマ（JSON パース時のバリデーション用）
 */
const visionAnalysisSchema = z.object({
  isImageClear: z.boolean(),
  containsAnimalOrTrace: z.boolean(),
  detectedAnimalType: z.string().optional(),
  description: z.string().optional(),
});

/**
 * AIのテキスト応答からJSONを抽出してパースする
 *
 * モデルの応答にはCode Execution結果やMarkdownコードブロックが
 * 含まれる場合があるため、JSONオブジェクトを正規表現で抽出する。
 */
function parseVisionJsonResponse(
  text: string
): z.infer<typeof visionAnalysisSchema> {
  // Markdownコードブロック（```json ... ```）を除去
  const cleaned = text
    .replace(/```(?:json)?\s*/g, '')
    .replace(/```/g, '')
    .trim();

  // JSONオブジェクトを抽出（最初の { から対応する } まで）
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('JSONが見つかりませんでした');
  }

  const parsed: unknown = JSON.parse(jsonMatch[0]);
  return visionAnalysisSchema.parse(parsed);
}

/**
 * AIを使用して画像を解析（Agentic Vision）
 *
 * Gemini 3 FlashのCode Executionツールにより、モデルが画像をズーム・クロップ・
 * アノテーションして能動的に分析。結果はJSON文字列で出力させ、パースして使用する。
 * thinkingLevel: medium により推論精度を向上させる。
 *
 * @param imageUrl 解析する画像のURL
 * @returns 各判定フラグを含む解析結果（合否判定はコード側で行う）
 */
export async function analyzeImageWithAI(
  imageUrl: string
): Promise<ImageAnalysisResult> {
  try {
    const prompt = VISION_ANALYSIS_PROMPT;

    const result = await generateText({
      model: geminiVisionModel,
      tools: {
        code_execution: codeExecutionTool,
      },
      providerOptions: visionProviderOptions,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: imageUrl,
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      maxOutputTokens: modelConfig.maxTokens,
    });

    const parsed = parseVisionJsonResponse(result.text);

    return {
      success: true,
      isImageClear: parsed.isImageClear,
      containsAnimalOrTrace: parsed.containsAnimalOrTrace,
      detectedAnimalType: parsed.detectedAnimalType,
      description: parsed.description,
    };
  } catch (error) {
    console.error('画像解析エラー:', error);
    return {
      success: false,
      isImageClear: false,
      containsAnimalOrTrace: false,
      error:
        error instanceof Error ? error.message : '画像の解析に失敗しました',
    };
  }
}

/**
 * リバースジオコーディング結果
 */
export interface ReverseGeocodeResult {
  success: boolean;
  address?: string;
  normalizedAddress?: StructuredAddress;
  error?: string;
  /** ジオフェンス対象外の場合 true */
  geofenceBlocked?: boolean;
  /** ジオフェンスのプレフィックス（エラー表示用） */
  geofencePrefix?: string;
}

/**
 * 緯度経度から住所を取得（逆ジオコーディング）
 *
 * @param latitude 緯度
 * @param longitude 経度
 * @returns 住所取得結果
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  try {
    const geoRepository = DIContainer.getGeoRepository();
    const useCase = new ReverseGeocodeUseCase(geoRepository);
    const geocode = await useCase.execute(latitude, longitude);
    const address = geocode.address;

    // ジオフェンスチェック
    const settingRepository = DIContainer.getSystemSettingRepository();
    const settingUseCase = new GetSystemSettingUseCase(settingRepository);
    const setting = await settingUseCase.execute();
    const prefix = setting.value.geofenceAddressPrefix;

    if (prefix && !address.startsWith(prefix)) {
      return {
        success: true,
        address,
        normalizedAddress: geocode.normalizedAddress,
        geofenceBlocked: true,
        geofencePrefix: prefix,
      };
    }

    return {
      success: true,
      address,
      normalizedAddress: geocode.normalizedAddress,
    };
  } catch (error) {
    console.error('リバースジオコーディングエラー:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '住所の取得に失敗しました',
    };
  }
}

/**
 * 周辺ランドマーク検索結果
 */
export interface SearchNearbyLandmarksResult {
  success: boolean;
  landmarks?: NearbyLandmark[];
  error?: string;
}

/**
 * 緯度経度から周辺のランドマーク・施設を検索
 *
 * @param latitude 緯度
 * @param longitude 経度
 * @param radius 検索半径（メートル、デフォルト100）
 * @returns 周辺ランドマークのリスト
 */
export async function searchNearbyLandmarks(
  latitude: number,
  longitude: number,
  radius: number = 100
): Promise<SearchNearbyLandmarksResult> {
  try {
    const geoRepository = DIContainer.getGeoRepository();
    const useCase = new SearchNearbyLandmarksUseCase(geoRepository);
    const landmarks = await useCase.execute(latitude, longitude, radius);

    return {
      success: true,
      landmarks,
    };
  } catch (error) {
    console.error('周辺ランドマーク検索エラー:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : '周辺施設の検索に失敗しました',
    };
  }
}

/**
 * レポート案生成パラメータ
 */
export interface GenerateReportDraftParams {
  animalType: AnimalTypeValue;
  situation: string;
  dateTime: Date;
  location: LocationData;
}

/**
 * レポート案を生成
 *
 * @param params 生成パラメータ
 * @returns 生成されたレポート案
 */
export async function generateReportDraft(
  params: GenerateReportDraftParams
): Promise<ReportDraft> {
  const { animalType, situation, dateTime, location } = params;

  return {
    when: formatDateTime(dateTime),
    where: formatLocationWithLandmark(location),
    what: getAnimalTypeLabel(animalType),
    situation: situation,
  };
}

/**
 * レポート案再生成スキーマ
 */
const reportDraftSchema = z.object({
  when: z.string().describe('目撃日時（例: 2024年1月15日 14:30頃）'),
  where: z.string().describe('目撃場所（住所や地名）'),
  what: z.string().describe('目撃した動物（種類）'),
  situation: z.string().describe('状況・行動の説明'),
});

/**
 * 修正指摘を反映してレポート案を再生成
 *
 * @param currentDraft 現在のレポート案
 * @param correction ユーザーからの修正指摘
 * @returns 修正後のレポート案
 */
export async function regenerateReportDraft(
  currentDraft: ReportDraft,
  correction: string
): Promise<ReportDraft> {
  try {
    const result = await generateObject({
      model: geminiModel,
      schema: reportDraftSchema,
      prompt: `現在のレポート内容:
- いつ: ${currentDraft.when}
- どこで: ${currentDraft.where}
- 何が: ${currentDraft.what}
- 状況: ${currentDraft.situation}

ユーザーからの修正指摘:
「${correction}」

上記の修正指摘を反映して、レポートを更新してください。
指摘されていない部分は変更しないでください。
事実の整理に徹し、評価・推測は行わないでください。`,
      ...modelConfig,
    });

    return result.object;
  } catch (error) {
    console.error('レポート再生成エラー:', error);
    // エラー時は元のレポートを返す
    return currentDraft;
  }
}
