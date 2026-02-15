'use client';

import { useRef, useState } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import {
  faCamera,
  faCircleCheck,
  faCircleXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { BotMessage } from '@/features/ai-report/components/BotMessage';
import {
  uploadedPhotoUrlsAtom,
  aiAnalysisResultAtom,
  currentStepAtom,
  isProcessingAtom,
  selectedAnimalTypeAtom,
} from '@/features/ai-report/atoms/lineVerifyAtoms';
import { BOT_MESSAGES } from '@/features/ai-report/types';
import {
  uploadImage,
  simulateAIAnalysis,
} from '@/features/ai-report/actions';

/**
 * Step2: 写真アップロードステップ
 */
export const PhotoUploadStep = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const setUploadedPhotoUrls = useSetAtom(uploadedPhotoUrlsAtom);
  const setAiAnalysisResult = useSetAtom(aiAnalysisResultAtom);
  const setCurrentStep = useSetAtom(currentStepAtom);
  const setIsProcessing = useSetAtom(isProcessingAtom);
  const isProcessing = useAtomValue(isProcessingAtom);
  const selectedAnimalType = useAtomValue(selectedAnimalTypeAtom);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsProcessing(true);

    try {
      // プレビュー用のURLを生成
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // サーバーにアップロード
      const formData = new FormData();
      formData.append('image', file);
      const result = await uploadImage(formData);

      if (!result.success || !result.url) {
        throw new Error(result.error || 'アップロードに失敗しました');
      }

      // アップロードされたURLを保存
      setUploadedPhotoUrls([result.url]);

      // AI解析をシミュレート
      const analysisMessage = await simulateAIAnalysis(
        selectedAnimalType || 'other'
      );

      setAiAnalysisResult({
        detectedAnimal: selectedAnimalType,
        confidence: 0.85,
        message: analysisMessage,
      });
    } catch (error) {
      console.error('アップロードエラー:', error);
      setUploadError(
        error instanceof Error ? error.message : 'アップロードに失敗しました'
      );
      setPreviewUrl(null);
      setUploadedPhotoUrls([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    setCurrentStep('location');
  };

  const handleBack = () => {
    setCurrentStep('animal-type');
  };

  const uploadedPhotoUrls = useAtomValue(uploadedPhotoUrlsAtom);
  const uploadedPhotoUrl = uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls[0] : null;

  return (
    <div className="space-y-6">
      <BotMessage message={BOT_MESSAGES['photo']} />

      {/* 必須表示 */}
      <p className="text-sm text-red-600">※ 写真のアップロードは必須です</p>

      {/* ファイルアップロードエリア */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`
          cursor-pointer rounded-lg border-2 border-dashed p-8 text-center
          transition-colors
          hover:bg-solid-gray-50
          ${previewUrl ? 'border-blue-400' : 'border-solid-gray-300'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="アップロード画像"
              className="mx-auto max-h-48 rounded-lg object-contain"
            />
            <p className="text-sm text-solid-gray-600">
              クリックして画像を変更
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <FontAwesomeIcon
                icon={faCamera}
                className="size-10 text-solid-gray-500"
                aria-hidden="true"
              />
            </div>
            <p className="text-solid-gray-600">
              クリックまたはドラッグして画像をアップロード
            </p>
            <p className="text-sm text-solid-gray-400">
              JPG, PNG, GIF 形式に対応
            </p>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {uploadError && (
        <Card className="bg-red-50">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faCircleXmark}
              className="size-6 text-red-700"
              aria-hidden="true"
            />
            <span className="text-red-800">{uploadError}</span>
          </div>
        </Card>
      )}

      {/* 処理中表示 */}
      {isProcessing && (
        <Card className="bg-blue-50">
          <div className="flex items-center gap-3">
            <div
              className={`
                size-5 animate-spin rounded-full border-2 border-blue-900
                border-t-transparent
              `}
            />
            <span className="text-blue-900">画像をアップロード・解析中...</span>
          </div>
        </Card>
      )}

      {/* 成功表示 */}
      {!isProcessing && uploadedPhotoUrl && (
        <Card className="bg-green-50">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="size-6 text-green-700"
              aria-hidden="true"
            />
            <div>
              <span className="text-green-800">
                画像のアップロードが完了しました
              </span>
              <p className="mt-1 truncate text-xs text-green-600">
                URL: {uploadedPhotoUrl}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ナビゲーションボタン */}
      <div className="flex justify-between gap-3">
        <Button size="md" variant="outline" onClick={handleBack}>
          戻る
        </Button>
        <Button
          size="md"
          variant="solid-fill"
          onClick={handleNext}
          aria-disabled={isProcessing || !uploadedPhotoUrl}
        >
          次へ
        </Button>
      </div>
    </div>
  );
};
