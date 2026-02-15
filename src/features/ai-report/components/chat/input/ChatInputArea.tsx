import React from 'react';
import { useAtomValue } from 'jotai';
import type {
  AnimalTypeValue,
  LocationData,
  NearbyLandmark,
} from '@/features/ai-report/types';
import type {
  ActionCategory,
  QuestionChoice,
} from '@/features/ai-report/types/actionDetail';
import type { AnimalTypeConfig } from '@/server/domain/constants/animalTypes';
import {
  currentInputModeAtom,
  isActionProcessingAtom,
} from '@/features/ai-report/atoms/chatAtoms';
import { currentQuestionAtom } from '@/features/ai-report/atoms/actionDetailAtoms';
import AnimalTypeButtons from './AnimalTypeButtons';
import PhotoUploadInput from './PhotoUploadInput';
import ImageDescriptionConfirm from './ImageDescriptionButtons';
import SituationInput from './SituationInput';
import ActionCategoryButtons from './ActionCategoryButtons';
import ActionQuestionInput from './ActionQuestionInput';
import ActionDetailConfirmInput, {
  ActionDetailCorrectionInput,
} from './ActionDetailConfirmInput';
import DateTimeInput from './DateTimeInput';
import LocationInput from './LocationInput';
import NearbyLandmarksSelector from './NearbyLandmarksSelector';
import ReportConfirmInput from './ReportConfirmInput';
import CorrectionInput from './CorrectionInput';
import PhoneNumberInput from './PhoneNumberInput';
import CompletionActions from './CompletionActions';

interface ChatInputAreaProps {
  enabledAnimalTypes: AnimalTypeConfig[];
  onAnimalSelect: (type: AnimalTypeValue) => void;
  onPhotoUpload: (file: File) => void;
  onImageDescriptionConfirm: () => void;
  onImageDescriptionCorrect: (correctionText: string) => void;
  onPhotoSkip?: () => void;
  onSituationSubmit: (text: string) => void;
  // 行動詳細深掘りAI用コールバック
  onActionCategorySelect?: (
    category: ActionCategory,
    label: string,
    icon: string
  ) => void;
  onActionQuestionAnswer?: (
    questionId: string,
    selectedChoices: QuestionChoice[],
    otherText?: string
  ) => void;
  onActionDetailConfirm?: () => void;
  onActionDetailRequestCorrection?: () => void;
  onActionDetailCorrectionSubmit?: (text: string) => void;
  onActionDetailCorrectionCancel?: () => void;
  onActionDetailBackToQuestion?: () => void;
  // 日時・位置・確認
  onDateTimeSubmit: (dateTime: Date) => void;
  onLocationSubmit: (location: LocationData) => void;
  // 周辺施設選択
  onNearbyLandmarkSelect?: (landmark: NearbyLandmark) => void;
  onNearbyLandmarkSkip?: () => void;
  nearbyLandmarks?: NearbyLandmark[];
  // 確認・送信
  onRequestCorrection: () => void;
  onCorrectionSubmit: (text: string) => void;
  onConfirm: () => void;
  // 電話番号入力
  onPhoneNumberSubmit?: (phoneNumber: string) => void;
  onPhoneNumberSkip?: () => void;
  onStartOver: () => void;
  reportId?: string;
  reportToken?: string;
  reportLocation?: { latitude: number; longitude: number } | null;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  enabledAnimalTypes,
  onAnimalSelect,
  onPhotoUpload,
  onImageDescriptionConfirm,
  onImageDescriptionCorrect,
  onPhotoSkip,
  onSituationSubmit,
  onActionCategorySelect,
  onActionQuestionAnswer,
  onActionDetailConfirm,
  onActionDetailRequestCorrection,
  onActionDetailCorrectionSubmit,
  onActionDetailCorrectionCancel,
  onActionDetailBackToQuestion,
  onDateTimeSubmit,
  onLocationSubmit,
  onNearbyLandmarkSelect,
  onNearbyLandmarkSkip,
  nearbyLandmarks,
  onRequestCorrection,
  onCorrectionSubmit,
  onConfirm,
  onPhoneNumberSubmit,
  onPhoneNumberSkip,
  onStartOver,
  reportId,
  reportToken,
  reportLocation,
}) => {
  const inputMode = useAtomValue(currentInputModeAtom);
  const isProcessing = useAtomValue(isActionProcessingAtom);
  const currentQuestion = useAtomValue(currentQuestionAtom);

  if (inputMode === 'disabled' || isProcessing) {
    return (
      <div className={`
        mx-auto flex h-16 max-w-3xl items-center justify-center p-4
      `}>
        {isProcessing ? (
          <div className="flex items-center gap-2 text-solid-gray-600">
            <div className={`
              size-4 animate-spin rounded-full border-2 border-blue-900
              border-t-transparent
            `} />
            <span>処理中...</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      {inputMode === 'animal-selection' && (
        <AnimalTypeButtons onSelect={onAnimalSelect} enabledAnimalTypes={enabledAnimalTypes} />
      )}
      {inputMode === 'photo-upload' && (
        <PhotoUploadInput
          onUpload={onPhotoUpload}
          onSkip={onPhotoSkip}
          isUploading={isProcessing}
        />
      )}
      {inputMode === 'image-description-confirm' && (
        <ImageDescriptionConfirm
          onConfirm={onImageDescriptionConfirm}
          onCorrect={onImageDescriptionCorrect}
          isProcessing={isProcessing}
        />
      )}
      {inputMode === 'image-description-correction' && (
        <ImageDescriptionConfirm
          onConfirm={onImageDescriptionConfirm}
          onCorrect={onImageDescriptionCorrect}
          isProcessing={isProcessing}
          showCorrectionInput
        />
      )}
      {inputMode === 'situation-input' && (
        <SituationInput onSubmit={onSituationSubmit} />
      )}
      {inputMode === 'action-category-selection' && onActionCategorySelect && (
        <ActionCategoryButtons onSelect={onActionCategorySelect} />
      )}
      {inputMode === 'action-question' &&
        currentQuestion &&
        onActionQuestionAnswer && (
          <ActionQuestionInput
            question={currentQuestion}
            onAnswer={onActionQuestionAnswer}
            isProcessing={isProcessing}
          />
        )}
      {inputMode === 'action-detail-confirm' &&
        onActionDetailConfirm &&
        onActionDetailRequestCorrection &&
        onActionDetailBackToQuestion && (
          <ActionDetailConfirmInput
            onConfirm={onActionDetailConfirm}
            onRequestCorrection={onActionDetailRequestCorrection}
            onBackToQuestion={onActionDetailBackToQuestion}
            isProcessing={isProcessing}
          />
        )}
      {inputMode === 'action-detail-correction' &&
        onActionDetailCorrectionSubmit &&
        onActionDetailCorrectionCancel && (
          <ActionDetailCorrectionInput
            onSubmit={onActionDetailCorrectionSubmit}
            onCancel={onActionDetailCorrectionCancel}
            isProcessing={isProcessing}
          />
        )}
      {inputMode === 'datetime-input' && (
        <DateTimeInput onSubmit={onDateTimeSubmit} />
      )}
      {inputMode === 'location-input' && (
        <LocationInput onSubmit={onLocationSubmit} />
      )}
      {inputMode === 'nearby-landmarks-selection' &&
        onNearbyLandmarkSelect &&
        onNearbyLandmarkSkip &&
        nearbyLandmarks && (
          <NearbyLandmarksSelector
            landmarks={nearbyLandmarks}
            onSelect={onNearbyLandmarkSelect}
            onSkip={onNearbyLandmarkSkip}
            isProcessing={isProcessing}
          />
        )}
      {inputMode === 'report-confirm' && (
        <ReportConfirmInput
          onRequestCorrection={onRequestCorrection}
          onSubmit={onConfirm}
          isProcessing={isProcessing}
        />
      )}
      {inputMode === 'phone-number-input' &&
        onPhoneNumberSubmit &&
        onPhoneNumberSkip && (
          <PhoneNumberInput
            onSubmit={onPhoneNumberSubmit}
            onSkip={onPhoneNumberSkip}
          />
        )}
      {inputMode === 'report-correction' && (
        <CorrectionInput onSubmit={onCorrectionSubmit} />
      )}
      {inputMode === 'completion-actions' && (
        <CompletionActions
          onStartOver={onStartOver}
          reportId={reportId}
          reportToken={reportToken}
          reportLocation={reportLocation}
        />
      )}
    </div>
  );
};

export default ChatInputArea;
