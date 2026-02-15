'use client';

import { useSetAtom, useAtomValue } from 'jotai';
import Button from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { BotMessage } from '@/features/ai-report/components/BotMessage';
import {
  currentStepAtom,
  simulationDataAtom,
  isProcessingAtom,
  descriptionAtom,
} from '@/features/ai-report/atoms/lineVerifyAtoms';
import { BOT_MESSAGES, ANIMAL_TYPE_LABELS } from '@/features/ai-report/types';
import { FormField } from '@/components/ui/FormField/FormField';
import { formatLocationWithLandmark } from '@/features/ai-report/utils/locationFormatter';

interface ConfirmStepProps {
  onSubmit: () => void;
}

/**
 * Step4: 確認ステップ
 */
export const ConfirmStep = ({ onSubmit }: ConfirmStepProps) => {
  const simulationData = useAtomValue(simulationDataAtom);
  const isProcessing = useAtomValue(isProcessingAtom);
  const setCurrentStep = useSetAtom(currentStepAtom);
  const setDescription = useSetAtom(descriptionAtom);
  const description = useAtomValue(descriptionAtom);

  const handleBack = () => {
    setCurrentStep('location');
  };

  const handleSubmit = () => {
    onSubmit();
  };

  // 送信可能かどうか（動物種、位置情報、写真が必須）
  const canSubmit =
    simulationData.animalType !== null &&
    simulationData.location !== null &&
    simulationData.photoUrls.length > 0;

  return (
    <div className="space-y-6">
      <BotMessage message={BOT_MESSAGES['confirm']} />

      {/* 入力内容サマリー */}
      <Card title="入力内容の確認">
        <div className="space-y-4">
          {/* 動物種 */}
          <div
            className={`
              flex items-start justify-between border-b border-solid-gray-200
              pb-3
            `}
          >
            <span className="text-sm text-solid-gray-600">動物種</span>
            <span className="font-semibold">
              {simulationData.animalType
                ? ANIMAL_TYPE_LABELS[simulationData.animalType]
                : '未選択'}
            </span>
          </div>

          {/* 写真 */}
          <div
            className={`
              flex items-start justify-between border-b border-solid-gray-200
              pb-3
            `}
          >
            <span className="text-sm text-solid-gray-600">写真（必須）</span>
            <div className="text-right">
              {simulationData.photoUrls.length > 0 ? (
                <div className="flex flex-col items-end gap-2">
                  <span className="text-green-600">アップロード済み（{simulationData.photoUrls.length}枚）</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={simulationData.photoUrls[0]}
                    alt="アップロード画像"
                    className="size-16 rounded object-cover"
                  />
                </div>
              ) : (
                <span className="text-red-600">未アップロード</span>
              )}
            </div>
          </div>

          {/* 位置情報 */}
          <div
            className={`
              flex items-start justify-between border-b border-solid-gray-200
              pb-3
            `}
          >
            <span className="text-sm text-solid-gray-600">位置情報</span>
            <div className="text-right">
              {simulationData.location ? (
                <div>
                  <p className="font-semibold">
                    {formatLocationWithLandmark(simulationData.location)}
                  </p>
                  <p className="text-xs text-solid-gray-500">
                    ({simulationData.location.latitude.toFixed(4)},{' '}
                    {simulationData.location.longitude.toFixed(4)})
                  </p>
                </div>
              ) : (
                <span className="text-solid-gray-400">未設定</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 追加説明 */}
      <FormField
        id="description"
        label="被害の詳細（任意）"
        type="textarea"
        value={description}
        onChange={(value) => setDescription(value)}
        placeholder="被害の状況や追加情報があれば記入してください"
        supportText="農作物への被害、目撃状況など"
      />

      {/* ナビゲーションボタン */}
      <div className="flex justify-between gap-3">
        <Button
          size="md"
          variant="outline"
          onClick={handleBack}
          aria-disabled={isProcessing}
        >
          戻る
        </Button>
        <Button
          size="md"
          variant="solid-fill"
          onClick={handleSubmit}
          aria-disabled={!canSubmit || isProcessing}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span
                className={`
                  size-4 animate-spin rounded-full border-2 border-white
                  border-t-transparent
                `}
              />
              送信中...
            </span>
          ) : (
            '送信する'
          )}
        </Button>
      </div>
    </div>
  );
};
