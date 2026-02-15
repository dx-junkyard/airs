'use client';

import { useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Card } from '@/components/ui/Card/Card';
import Button from '@/components/ui/Button/Button';
import { StepIndicator } from '@/features/ai-report/components/StepIndicator';
import { AnimalTypeStep } from '@/features/ai-report/components/AnimalTypeStep';
import { PhotoUploadStep } from '@/features/ai-report/components/PhotoUploadStep';
import { LocationStep } from '@/features/ai-report/components/LocationStep';
import { ConfirmStep } from '@/features/ai-report/components/ConfirmStep';
import { CompletionStep } from '@/features/ai-report/components/CompletionStep';
import {
  currentStepAtom,
  simulationDataAtom,
  resetSimulationAtom,
  isProcessingAtom,
  reportTokenAtom,
} from '@/features/ai-report/atoms/lineVerifyAtoms';
import { ANIMAL_TYPE_LABELS } from '@/features/ai-report/types';
import type { AnimalTypeConfig } from '@/server/domain/constants/animalTypes';
import useLineVerifyReport from '@/hooks/mutations/useLineVerifyReport';
import { generateReportTokenAction } from '@/features/report/tokenActions';
import { formatLocationWithLandmark } from '@/features/ai-report/utils/locationFormatter';

interface LineVerifySimulatorProps {
  enabledAnimalTypes: AnimalTypeConfig[];
}

/**
 * AI獣害通報 メインコンテナ
 */
export const LineVerifySimulator = ({ enabledAnimalTypes }: LineVerifySimulatorProps) => {
  const currentStep = useAtomValue(currentStepAtom);
  const simulationData = useAtomValue(simulationDataAtom);
  const resetSimulation = useSetAtom(resetSimulationAtom);
  const setIsProcessing = useSetAtom(isProcessingAtom);
  const setReportToken = useSetAtom(reportTokenAtom);
  const reportToken = useAtomValue(reportTokenAtom);
  const [createdReportId, setCreatedReportId] = useState<string | undefined>();

  const { mutate, isPending } = useLineVerifyReport({
    onSuccess: async (data) => {
      setCreatedReportId(data.id);
      const token = await generateReportTokenAction(data.id);
      setReportToken(token);
    },
  });

  const handleSubmit = () => {
    if (!simulationData.animalType || !simulationData.location) {
      return;
    }

    setIsProcessing(true);

    const formData = new FormData();
    formData.append('animalType', simulationData.animalType);
    formData.append('latitude', simulationData.location.latitude.toString());
    formData.append('longitude', simulationData.location.longitude.toString());
    formData.append('address', simulationData.location.address);
    if (simulationData.location.normalizedAddress) {
      formData.append(
        'normalizedAddress',
        JSON.stringify(simulationData.location.normalizedAddress)
      );
    }
    formData.append(
      'description',
      simulationData.description ||
        `${ANIMAL_TYPE_LABELS[simulationData.animalType]}による被害報告`
    );
    // アップロードされた画像URLがあれば使用（説明文なし）
    const images = simulationData.photoUrls.map((url: string) => ({
      url,
      description: '',
    }));
    formData.append('images', JSON.stringify(images));

    mutate(formData);
  };

  const handleReset = () => {
    resetSimulation();
    setCreatedReportId(undefined);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'animal-type':
        return <AnimalTypeStep enabledAnimalTypes={enabledAnimalTypes} />;
      case 'photo':
        return <PhotoUploadStep />;
      case 'location':
        return <LocationStep />;
      case 'confirm':
        return <ConfirmStep onSubmit={handleSubmit} />;
      case 'complete':
        return <CompletionStep reportId={createdReportId} reportToken={reportToken} />;
      default:
        return <AnimalTypeStep enabledAnimalTypes={enabledAnimalTypes} />;
    }
  };

  // これまでの入力サマリー（完了ステップ以外で表示）
  const renderInputSummary = () => {
    if (currentStep === 'animal-type' || currentStep === 'complete') {
      return null;
    }

    const hasData =
      simulationData.animalType ||
      simulationData.photoUrls.length > 0 ||
      simulationData.location;

    if (!hasData) return null;

    return (
      <Card title="これまでの入力" padding="sm" className="mt-6">
        <div className="space-y-2 text-sm">
          {simulationData.animalType && (
            <div className="flex justify-between">
              <span className="text-solid-gray-600">動物種</span>
              <span className="font-medium">
                {ANIMAL_TYPE_LABELS[simulationData.animalType]}
              </span>
            </div>
          )}
          {simulationData.photoUrls.length > 0 && (
            <div className="flex justify-between">
              <span className="text-solid-gray-600">写真</span>
              <span className="text-green-600">アップロード済み</span>
            </div>
          )}
          {simulationData.location && (
            <div className="flex justify-between gap-2">
              <span className="text-solid-gray-600">位置</span>
              <div className="max-w-[220px] text-right">
                <p className="truncate font-medium">
                  {formatLocationWithLandmark(simulationData.location)}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* ステップインジケーター */}
      <StepIndicator currentStep={currentStep} />

      {/* 現在のステップ */}
      <Card>{renderCurrentStep()}</Card>

      {/* 入力サマリー */}
      {renderInputSummary()}

      {/* リセットボタン（完了ステップ以外） */}
      {currentStep !== 'complete' && currentStep !== 'animal-type' && (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="text"
            onClick={handleReset}
            aria-disabled={isPending}
          >
            最初からやり直す
          </Button>
        </div>
      )}
    </div>
  );
};
