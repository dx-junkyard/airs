import { atom } from 'jotai';
import type {
  ChatMessage,
  ChatInputMode,
} from '@/features/ai-report/types/chat';
import type { NearbyLandmark } from '@/features/ai-report/types';

/**
 * All chat messages in conversation order
 */
export const messagesAtom = atom<ChatMessage[]>([]);

/**
 * Current input mode based on chat flow state
 */
export const currentInputModeAtom = atom<ChatInputMode>('disabled');

/**
 * Whether bot is "typing" (for animation)
 */
export const isBotTypingAtom = atom<boolean>(false);

/**
 * Whether an action is being processed (upload, submission, etc.)
 */
export const isActionProcessingAtom = atom<boolean>(false);

/**
 * Current image analysis description for confirmation
 */
export const imageAnalysisDescriptionAtom = atom<string | null>(null);

/**
 * Current nearby landmarks for selection
 */
export const nearbyLandmarksAtom = atom<NearbyLandmark[]>([]);

/**
 * Derived atom: get the last message
 */
export const lastMessageAtom = atom((get) => {
  const messages = get(messagesAtom);
  return messages.length > 0 ? messages[messages.length - 1] : null;
});

/**
 * Action atom: Add a new message
 */
export const addMessageAtom = atom(null, (get, set, message: ChatMessage) => {
  const messages = get(messagesAtom);
  set(messagesAtom, [...messages, message]);
});

/**
 * Action atom: Remove the last message (useful for removing loading messages)
 */
export const removeLastMessageAtom = atom(null, (get, set) => {
  const messages = get(messagesAtom);
  if (messages.length > 0) {
    set(messagesAtom, messages.slice(0, -1));
  }
});

/**
 * Action atom: Add multiple messages with delay
 */
export const addMessagesWithDelayAtom = atom(
  null,
  async (
    get,
    set,
    messages: ChatMessage[],
    delayMs: number = 500
  ): Promise<void> => {
    for (const message of messages) {
      set(isBotTypingAtom, true);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      set(isBotTypingAtom, false);
      set(addMessageAtom, message);
    }
  }
);

/**
 * Action atom: Reset entire chat state
 */
export const resetChatAtom = atom(null, (get, set) => {
  set(messagesAtom, []);
  set(currentInputModeAtom, 'disabled');
  set(isBotTypingAtom, false);
  set(isActionProcessingAtom, false);
  set(imageAnalysisDescriptionAtom, null);
  set(nearbyLandmarksAtom, []);
});
