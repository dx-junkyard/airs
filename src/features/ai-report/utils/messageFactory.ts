import { v4 as uuidv4 } from 'uuid';
import type {
  BotTextMessage,
  BotOptionsMessage,
  BotFileUploadPromptMessage,
  BotLocationPromptMessage,
  BotConfirmationMessage,
  BotImageAnalysisDescriptionMessage,
  BotReportDraftMessage,
  BotActionCategoryOptionsMessage,
  BotActionQuestionMessage,
  BotActionDetailMessage,
  BotNearbyLandmarksMessage,
  ReportDraft,
  UserTextMessage,
  UserSelectionMessage,
  UserImageMessage,
  UserLocationMessage,
  UserDateTimeMessage,
  UserActionCategoryMessage,
  UserActionAnswerMessage,
  UserNearbyLandmarkMessage,
  SystemMessage,
} from '@/features/ai-report/types/chat';
import type { NearbyLandmark } from '@/features/ai-report/types';
import type {
  ActionCategory,
  QuestionCard,
  QuestionChoice,
} from '@/features/ai-report/types/actionDetail';

export function createBotTextMessage(content: string): BotTextMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'bot',
    type: 'text',
    content,
  };
}

export function createBotOptionsMessage(
  content: string,
  options: Array<{ id: string; label: string; icon?: string; value: string }>
): BotOptionsMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'bot',
    type: 'options',
    content,
    options,
  };
}

export function createBotFileUploadPromptMessage(
  content: string,
  config: { isRequired: boolean; acceptTypes?: string }
): BotFileUploadPromptMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'bot',
    type: 'file-upload-prompt',
    content,
    ...config,
  };
}

export function createBotLocationPromptMessage(
  content: string
): BotLocationPromptMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'bot',
    type: 'location-prompt',
    content,
  };
}

export function createBotConfirmationMessage(
  content: string,
  summary: {
    animalType: string;
    hasPhoto: boolean;
    photoUrl?: string;
    location?: string;
  }
): BotConfirmationMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'bot',
    type: 'confirmation',
    content,
    summary,
  };
}

export function createBotImageAnalysisDescriptionMessage(
  content: string,
  description: string
): BotImageAnalysisDescriptionMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'bot',
    type: 'image-analysis-description',
    content,
    description,
  };
}

export function createBotReportDraftMessage(
  draft: ReportDraft
): BotReportDraftMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'bot',
    type: 'report-draft',
    draft,
  };
}

export function createUserSelectionMessage(selectedOption: {
  label: string;
  value: string;
  icon?: string;
}): UserSelectionMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'user',
    type: 'selection',
    selectedOption,
  };
}

export function createUserImageMessage(
  imageUrl: string,
  fileName?: string
): UserImageMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'user',
    type: 'image',
    imageUrl,
    fileName,
  };
}

export function createUserLocationMessage(location: {
  latitude: number;
  longitude: number;
  address: string;
}): UserLocationMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'user',
    type: 'location',
    location,
  };
}

export function createUserTextMessage(content: string): UserTextMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'user',
    type: 'text',
    content,
  };
}

export function createUserDateTimeMessage(dateTime: Date): UserDateTimeMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'user',
    type: 'datetime',
    dateTime,
  };
}

export function createSystemMessage(
  status: 'loading' | 'success' | 'error' | 'info',
  content: string
): SystemMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'system',
    type: 'status',
    status,
    content,
  };
}

// ========== 行動詳細深掘りAI用ファクトリ関数 ==========

export function createBotActionCategoryOptionsMessage(
  content: string,
  options: Array<{
    id: ActionCategory;
    label: string;
    description: string;
    icon: string;
  }>
): BotActionCategoryOptionsMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'bot',
    type: 'action-category-options',
    content,
    options,
  };
}

export function createBotActionQuestionMessage(
  question: QuestionCard
): BotActionQuestionMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'bot',
    type: 'action-question',
    question,
  };
}

export function createBotActionDetailMessage(
  content: string,
  detail: string,
  category: ActionCategory
): BotActionDetailMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'bot',
    type: 'action-detail',
    content,
    detail,
    category,
  };
}

export function createUserActionCategoryMessage(
  category: ActionCategory,
  label: string,
  icon: string
): UserActionCategoryMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'user',
    type: 'action-category',
    category,
    label,
    icon,
  };
}

export function createUserActionAnswerMessage(
  questionId: string,
  selectedChoices: QuestionChoice[],
  otherText?: string
): UserActionAnswerMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'user',
    type: 'action-answer',
    questionId,
    selectedChoices,
    otherText,
  };
}

// ========== 周辺施設関連ファクトリ関数 ==========

export function createBotNearbyLandmarksMessage(
  content: string,
  landmarks: NearbyLandmark[]
): BotNearbyLandmarksMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'bot',
    type: 'nearby-landmarks',
    content,
    landmarks,
  };
}

export function createUserNearbyLandmarkMessage(
  landmark: NearbyLandmark | null
): UserNearbyLandmarkMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'user',
    type: 'nearby-landmark',
    landmark,
  };
}
