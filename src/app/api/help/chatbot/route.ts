import { streamText } from 'ai';
import type { ModelMessage } from 'ai';
import {
  geminiModel,
  modelConfig,
} from '@/server/infrastructure/ai/config/geminiConfig';
import { HELP_CHATBOT_SYSTEM_PROMPT } from '@/features/help-chatbot/utils/systemPrompt';

export const maxDuration = 60;

// UIMessage part types
interface TextPart {
  type: 'text';
  text: string;
}

interface UIMessagePart {
  type: string;
  text?: string;
}

interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: UIMessagePart[];
}

/**
 * Convert UIMessage to ModelMessage format
 */
function convertUIMessagesToModel(uiMessages: UIMessage[]): ModelMessage[] {
  return uiMessages.map((msg) => {
    const textParts = msg.parts.filter(
      (part): part is TextPart =>
        part.type === 'text' && typeof part.text === 'string'
    );
    const textContent = textParts.map((p) => p.text).join('');

    return {
      role: msg.role,
      content: textContent,
    } as ModelMessage;
  });
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const modelMessages = convertUIMessagesToModel(messages as UIMessage[]);

  const result = streamText({
    model: geminiModel,
    system: HELP_CHATBOT_SYSTEM_PROMPT,
    messages: modelMessages,
    ...modelConfig,
  });

  return result.toUIMessageStreamResponse();
}
