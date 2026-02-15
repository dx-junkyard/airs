'use client';

import { useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faRotateLeft,
  faPaw,
  faCamera,
  faClock,
  faMapMarkerAlt,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import SharedChatContainer from '@/components/ui/Chat/ChatContainer/ChatContainer';
import ChatMessageList from './ChatMessageList';
import ChatInputArea from './input/ChatInputArea';
import Button from '@/components/ui/Button/Button';
import useChatFlow from '@/features/ai-report/hooks/useChatFlow';
import { currentStepAtom } from '@/features/ai-report/atoms/lineVerifyAtoms';
import { isActionProcessingAtom } from '@/features/ai-report/atoms/chatAtoms';
import type { AnimalTypeConfig } from '@/server/domain/constants/animalTypes';

/** 通報の流れステップ定義 */
const INTRO_STEPS = [
  { icon: faPaw, label: '獣種選択' },
  { icon: faCamera, label: '写真撮影' },
  { icon: faClock, label: '日時確認' },
  { icon: faMapMarkerAlt, label: '位置情報' },
  { icon: faCheckCircle, label: '通報完了' },
] as const;

/** AI獣害通報開始画面 */
const StartEmptyState: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="w-full max-w-md px-4 text-center">
    <div className="mb-6">
      <div
        className={`
          mx-auto mb-4 flex size-16 items-center justify-center rounded-full
          bg-blue-100
        `}
      >
        <FontAwesomeIcon icon={faPlay} className="size-7 text-blue-900" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-solid-gray-900">AI獣害通報</h2>
      <p className="text-sm leading-relaxed text-solid-gray-600">
        AIがチャット形式で獣害情報を聞き取り、
        <br />
        通報を自動作成します。
      </p>
    </div>

    {/* 通報の流れ */}
    <div className="mb-8 rounded-lg bg-solid-gray-50 px-4 py-5">
      <h3 className="mb-4 text-sm font-bold text-solid-gray-800">通報の流れ</h3>
      <div className="flex items-start justify-between gap-1">
        {INTRO_STEPS.map((step, index) => (
          <div key={step.label} className="flex items-start">
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex size-9 items-center justify-center rounded-full
                  bg-blue-100 text-blue-900
                `}
              >
                <FontAwesomeIcon icon={step.icon} className="size-4" />
              </div>
              <span
                className={`
                  mt-1.5 text-[11px] leading-tight text-solid-gray-600
                `}
              >
                {step.label}
              </span>
            </div>
            {index < INTRO_STEPS.length - 1 && (
              <div
                className={`
                  mx-0.5 mt-4 h-0.5 w-3 flex-shrink-0 bg-solid-gray-300
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>

    <Button onClick={onStart} size="lg">
      通報を開始
    </Button>
  </div>
);

interface ChatContainerProps {
  enabledAnimalTypes: AnimalTypeConfig[];
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ enabledAnimalTypes }) => {
  const [isChatStarted, setIsChatStarted] = useState(false);
  const currentStep = useAtomValue(currentStepAtom);
  const isProcessing = useAtomValue(isActionProcessingAtom);

  const {
    initializeChat,
    handleAnimalSelect,
    handlePhotoUpload,
    handlePhotoSkip,
    handleImageDescriptionConfirm,
    handleImageDescriptionCorrect,
    handleSituationSubmit,
    // 行動詳細深掘りAIハンドラ
    handleActionCategorySelect,
    handleActionQuestionAnswer,
    handleActionDetailConfirm,
    handleActionDetailRequestCorrection,
    handleActionDetailCorrectionSubmit,
    handleActionDetailCorrectionCancel,
    handleActionDetailBackToQuestion,
    // 日時・位置・確認
    handleDateTimeSubmit,
    handleLocationSubmit,
    // 周辺施設選択
    handleNearbyLandmarkSelect,
    handleNearbyLandmarkSkip,
    nearbyLandmarks,
    // 確認・送信
    handleRequestCorrection,
    handleCorrectionSubmit,
    handleConfirm,
    // 電話番号入力
    handlePhoneNumberSubmit,
    handlePhoneNumberSkip,
    handleStartOver,
    reportId,
    reportToken,
    selectedLocation,
  } = useChatFlow(enabledAnimalTypes);

  const handleStartChat = () => {
    setIsChatStarted(true);
    initializeChat();
  };

  const handleRestart = useCallback(() => {
    handleStartOver();
  }, [handleStartOver]);

  // 最初からやり直すボタンの表示条件:
  // チャット開始済み、最初のステップ(animal-type)と完了ステップ(complete)以外
  const showRestartButton =
    isChatStarted &&
    currentStep !== 'animal-type' &&
    currentStep !== 'complete';

  const inputArea = (
    <ChatInputArea
      enabledAnimalTypes={enabledAnimalTypes}
      onAnimalSelect={handleAnimalSelect}
      onPhotoUpload={handlePhotoUpload}
      onPhotoSkip={handlePhotoSkip}
      onImageDescriptionConfirm={handleImageDescriptionConfirm}
      onImageDescriptionCorrect={handleImageDescriptionCorrect}
      onSituationSubmit={handleSituationSubmit}
      // 行動詳細深掘りAI
      onActionCategorySelect={handleActionCategorySelect}
      onActionQuestionAnswer={handleActionQuestionAnswer}
      onActionDetailConfirm={handleActionDetailConfirm}
      onActionDetailRequestCorrection={handleActionDetailRequestCorrection}
      onActionDetailCorrectionSubmit={handleActionDetailCorrectionSubmit}
      onActionDetailCorrectionCancel={handleActionDetailCorrectionCancel}
      onActionDetailBackToQuestion={handleActionDetailBackToQuestion}
      // 日時・位置・確認
      onDateTimeSubmit={handleDateTimeSubmit}
      onLocationSubmit={handleLocationSubmit}
      // 周辺施設選択
      onNearbyLandmarkSelect={handleNearbyLandmarkSelect}
      onNearbyLandmarkSkip={handleNearbyLandmarkSkip}
      nearbyLandmarks={nearbyLandmarks}
      // 確認・送信
      onRequestCorrection={handleRequestCorrection}
      onCorrectionSubmit={handleCorrectionSubmit}
      onConfirm={handleConfirm}
      // 電話番号入力
      onPhoneNumberSubmit={handlePhoneNumberSubmit}
      onPhoneNumberSkip={handlePhoneNumberSkip}
      onStartOver={handleStartOver}
      reportId={reportId}
      reportToken={reportToken}
      reportLocation={selectedLocation}
    />
  );

  return (
    <SharedChatContainer
      inputArea={isChatStarted ? inputArea : undefined}
      emptyState={<StartEmptyState onStart={handleStartChat} />}
      showEmptyState={!isChatStarted}
      heightClassName="h-full"
      minHeightClassName=""
    >
      <div className="relative size-full">
        {showRestartButton && (
          <div className="absolute top-2 right-3 z-10">
            <button
              type="button"
              onClick={handleRestart}
              aria-disabled={isProcessing}
              className={`
                flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5
                text-xs text-solid-gray-600 shadow-sm ring-1 ring-solid-gray-200
                backdrop-blur-sm transition-colors
                hover:bg-solid-gray-50 hover:text-solid-gray-900
                aria-disabled:pointer-events-none aria-disabled:opacity-50
              `}
            >
              <FontAwesomeIcon icon={faRotateLeft} className="size-3" />
              最初からやり直す
            </button>
          </div>
        )}
        <ChatMessageList />
      </div>
    </SharedChatContainer>
  );
};

export default ChatContainer;
