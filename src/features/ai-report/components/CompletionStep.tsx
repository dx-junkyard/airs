'use client';

import { useSetAtom, useAtomValue } from 'jotai';
import Link from 'next/link';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { BotMessage } from '@/features/ai-report/components/BotMessage';
import {
  resetSimulationAtom,
  simulationDataAtom,
} from '@/features/ai-report/atoms/lineVerifyAtoms';
import { BOT_MESSAGES, ANIMAL_TYPE_LABELS } from '@/features/ai-report/types';

interface CompletionStepProps {
  reportId?: string;
  reportToken?: string;
}

/**
 * Step5: 完了ステップ
 */
export const CompletionStep = ({ reportId, reportToken }: CompletionStepProps) => {
  const resetSimulation = useSetAtom(resetSimulationAtom);
  const simulationData = useAtomValue(simulationDataAtom);

  const handleReset = () => {
    resetSimulation();
  };

  return (
    <div className="space-y-6">
      <BotMessage message={BOT_MESSAGES['complete']} />

      {/* 完了メッセージ */}
      <Card className="bg-green-50">
        <div className="flex items-center gap-3">
          <FontAwesomeIcon
            icon={faCircleCheck}
            className="size-7 text-green-700"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold text-green-800">通報が完了しました</p>
            <p className="text-sm text-green-700">
              ご協力ありがとうございます。
            </p>
          </div>
        </div>
      </Card>

      {/* 送信内容サマリー */}
      <Card title="送信内容">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-solid-gray-600">動物種</span>
            <span className="font-medium">
              {simulationData.animalType
                ? ANIMAL_TYPE_LABELS[simulationData.animalType]
                : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-solid-gray-600">位置</span>
            <span className="font-medium">
              {simulationData.location?.address ?? '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-solid-gray-600">写真</span>
            <span className="font-medium">
              {simulationData.photoUrls.length > 0 ? 'あり' : 'なし'}
            </span>
          </div>
        </div>
      </Card>

      {/* アクションボタン */}
      <div
        className={`
          flex flex-col gap-3
          sm:flex-row
        `}
      >
        <Button
          size="md"
          variant="solid-fill"
          onClick={handleReset}
          className="flex-1"
        >
          新しい通報を作成
        </Button>
        {reportToken && (
          <Link href={`/report?token=${reportToken}`} className="flex-1">
            <Button size="md" variant="outline" className="w-full">
              通報内容を確認・編集
            </Button>
          </Link>
        )}
        <Link href="/admin/report" className="flex-1">
          <Button size="md" variant="outline" className="w-full">
            通報一覧へ
          </Button>
        </Link>
      </div>
    </div>
  );
};
