import type { SimulationStep, NearbyLandmark } from './index';
import type {
  ActionCategory,
  QuestionCard,
  QuestionChoice,
} from './actionDetail';

/**
 * Message sender type
 */
export type MessageSender = 'bot' | 'user' | 'system';

/**
 * Input mode for chat input area
 */
export type ChatInputMode =
  | 'animal-selection' // Show animal type buttons
  | 'photo-upload' // Show file upload UI
  | 'image-description-confirm' // Show yes/no confirmation for AI description
  | 'image-description-correction' // Show text input for description correction
  | 'situation-input' // Show situation free text input
  | 'action-category-selection' // Show action category buttons
  | 'action-question' // Show action question card
  | 'action-detail-confirm' // Show action detail confirmation
  | 'action-detail-correction' // Show action detail correction input
  | 'datetime-input' // Show date/time picker
  | 'location-input' // Show location/address input
  | 'nearby-landmarks-selection' // Show nearby landmarks selection
  | 'report-confirm' // Show report confirmation buttons
  | 'phone-number-input' // Show phone number input (optional, before submission)
  | 'report-correction' // Show correction text input
  | 'completion-actions' // Show completion action buttons
  | 'disabled'; // No input allowed (loading, etc.)

/**
 * Report draft structure
 */
export interface ReportDraft {
  when: string;
  where: string;
  what: string;
  situation: string;
}

/**
 * Base message interface
 */
export interface BaseMessage {
  id: string;
  timestamp: Date;
  sender: MessageSender;
}

/**
 * Bot text message
 */
export interface BotTextMessage extends BaseMessage {
  sender: 'bot';
  type: 'text';
  content: string;
}

/**
 * Bot message with option buttons (e.g., animal type selection)
 */
export interface BotOptionsMessage extends BaseMessage {
  sender: 'bot';
  type: 'options';
  content: string;
  options: Array<{
    id: string;
    label: string;
    icon?: string;
    value: string;
  }>;
}

/**
 * Bot message prompting file upload
 */
export interface BotFileUploadPromptMessage extends BaseMessage {
  sender: 'bot';
  type: 'file-upload-prompt';
  content: string;
  acceptTypes?: string;
  isRequired: boolean;
}

/**
 * Bot message with location input prompt
 */
export interface BotLocationPromptMessage extends BaseMessage {
  sender: 'bot';
  type: 'location-prompt';
  content: string;
}

/**
 * Bot confirmation message with summary
 */
export interface BotConfirmationMessage extends BaseMessage {
  sender: 'bot';
  type: 'confirmation';
  content: string;
  summary: {
    animalType: string;
    hasPhoto: boolean;
    photoUrl?: string;
    location?: string;
  };
}

/**
 * Bot message with image analysis description for confirmation
 */
export interface BotImageAnalysisDescriptionMessage extends BaseMessage {
  sender: 'bot';
  type: 'image-analysis-description';
  content: string;
  description: string;
}

/**
 * Bot message with report draft
 */
export interface BotReportDraftMessage extends BaseMessage {
  sender: 'bot';
  type: 'report-draft';
  draft: ReportDraft;
}

/**
 * Bot message with action category options
 */
export interface BotActionCategoryOptionsMessage extends BaseMessage {
  sender: 'bot';
  type: 'action-category-options';
  content: string;
  options: Array<{
    id: ActionCategory;
    label: string;
    description: string;
    icon: string;
  }>;
}

/**
 * Bot message with action question card
 */
export interface BotActionQuestionMessage extends BaseMessage {
  sender: 'bot';
  type: 'action-question';
  question: QuestionCard;
}

/**
 * Bot message with generated action detail
 */
export interface BotActionDetailMessage extends BaseMessage {
  sender: 'bot';
  type: 'action-detail';
  content: string;
  detail: string;
  category: ActionCategory;
}

/**
 * Bot message with nearby landmarks options
 */
export interface BotNearbyLandmarksMessage extends BaseMessage {
  sender: 'bot';
  type: 'nearby-landmarks';
  content: string;
  landmarks: NearbyLandmark[];
}

/**
 * User action category selection
 */
export interface UserActionCategoryMessage extends BaseMessage {
  sender: 'user';
  type: 'action-category';
  category: ActionCategory;
  label: string;
  icon: string;
}

/**
 * User action question answer
 */
export interface UserActionAnswerMessage extends BaseMessage {
  sender: 'user';
  type: 'action-answer';
  questionId: string;
  selectedChoices: QuestionChoice[];
  otherText?: string;
}

/**
 * User nearby landmark selection
 */
export interface UserNearbyLandmarkMessage extends BaseMessage {
  sender: 'user';
  type: 'nearby-landmark';
  landmark: NearbyLandmark | null; // null = 該当なし
}

/**
 * User text response
 */
export interface UserTextMessage extends BaseMessage {
  sender: 'user';
  type: 'text';
  content: string;
}

/**
 * User selection response (chosen option)
 */
export interface UserSelectionMessage extends BaseMessage {
  sender: 'user';
  type: 'selection';
  selectedOption: {
    label: string;
    value: string;
    icon?: string;
  };
}

/**
 * User image upload message
 */
export interface UserImageMessage extends BaseMessage {
  sender: 'user';
  type: 'image';
  imageUrl: string;
  thumbnailUrl?: string;
  fileName?: string;
}

/**
 * User location message
 */
export interface UserLocationMessage extends BaseMessage {
  sender: 'user';
  type: 'location';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

/**
 * User datetime message
 */
export interface UserDateTimeMessage extends BaseMessage {
  sender: 'user';
  type: 'datetime';
  dateTime: Date;
}

/**
 * System status message (loading, errors, etc.)
 */
export interface SystemMessage extends BaseMessage {
  sender: 'system';
  type: 'status';
  status: 'loading' | 'success' | 'error' | 'info';
  content: string;
}

/**
 * Union type for all message types
 */
export type ChatMessage =
  | BotTextMessage
  | BotOptionsMessage
  | BotFileUploadPromptMessage
  | BotLocationPromptMessage
  | BotConfirmationMessage
  | BotImageAnalysisDescriptionMessage
  | BotReportDraftMessage
  | BotActionCategoryOptionsMessage
  | BotActionQuestionMessage
  | BotActionDetailMessage
  | BotNearbyLandmarksMessage
  | UserTextMessage
  | UserSelectionMessage
  | UserImageMessage
  | UserLocationMessage
  | UserDateTimeMessage
  | UserActionCategoryMessage
  | UserActionAnswerMessage
  | UserNearbyLandmarkMessage
  | SystemMessage;

/**
 * Type guard helpers
 */
export function isBotMessage(
  message: ChatMessage
): message is
  | BotTextMessage
  | BotOptionsMessage
  | BotFileUploadPromptMessage
  | BotLocationPromptMessage
  | BotConfirmationMessage
  | BotImageAnalysisDescriptionMessage
  | BotReportDraftMessage
  | BotActionCategoryOptionsMessage
  | BotActionQuestionMessage
  | BotActionDetailMessage
  | BotNearbyLandmarksMessage {
  return message.sender === 'bot';
}

export function isUserMessage(
  message: ChatMessage
): message is
  | UserTextMessage
  | UserSelectionMessage
  | UserImageMessage
  | UserLocationMessage
  | UserDateTimeMessage
  | UserActionCategoryMessage
  | UserActionAnswerMessage
  | UserNearbyLandmarkMessage {
  return message.sender === 'user';
}

export function isSystemMessage(
  message: ChatMessage
): message is SystemMessage {
  return message.sender === 'system';
}

/**
 * Chat conversation state
 */
export interface ChatState {
  messages: ChatMessage[];
  currentInputMode: ChatInputMode;
  isProcessing: boolean;
  currentStep: SimulationStep;
}
