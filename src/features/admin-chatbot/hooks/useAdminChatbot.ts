'use client';

import { useChat } from '@ai-sdk/react';
import type { UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useAtom } from 'jotai';
import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  isChatbotOpenAtom,
  adminDynamicSuggestionsAtom,
  adminIsFetchingSuggestionsAtom,
} from '@/features/admin-chatbot/atoms/adminChatbotAtoms';
import { SUGGESTED_QUESTIONS } from '@/features/admin-chatbot/utils/systemPrompt';

/**
 * Extract text content from UIMessage parts
 */
function extractTextFromMessage(message: UIMessage): string {
  if (!message.parts) return '';

  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => {
      if (part.type === 'text') {
        return part.text;
      }
      return '';
    })
    .join('');
}

/**
 * Fetch suggested questions from API
 */
async function fetchSuggestions(
  lastUserQuestion: string,
  lastAssistantResponse: string
): Promise<string[]> {
  try {
    const response = await fetch('/api/admin/chatbot/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lastUserQuestion, lastAssistantResponse }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch suggestions');
    }

    const data = (await response.json()) as { suggestions: string[] };
    return data.suggestions || [];
  } catch (error) {
    console.error('Failed to fetch admin suggestions:', error);
    return [];
  }
}

/**
 * useAdminChatbot
 *
 * 管理者ヘルプチャットボットの状態とアクションを管理するカスタムフック
 */
export function useAdminChatbot() {
  const [isOpen, setIsOpen] = useAtom(isChatbotOpenAtom);
  const [dynamicSuggestions, setDynamicSuggestions] = useAtom(
    adminDynamicSuggestionsAtom
  );
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useAtom(
    adminIsFetchingSuggestionsAtom
  );
  const [input, setInput] = useState('');

  const prevStatusRef = useRef<string>('ready');

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/admin/chatbot' }),
    []
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const isChatStarted = messages.length > 0;

  /**
   * ストリーミング完了時におすすめ質問を取得
   */
  useEffect(() => {
    const wasStreaming =
      prevStatusRef.current === 'streaming' ||
      prevStatusRef.current === 'submitted';
    const isNowReady = status === 'ready';

    prevStatusRef.current = status;

    if (wasStreaming && isNowReady && messages.length >= 2) {
      const lastAssistantMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'assistant');

      let lastUserMessage: UIMessage | undefined;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (
          messages[i].role === 'assistant' &&
          messages[i].id === lastAssistantMessage?.id
        ) {
          for (let j = i - 1; j >= 0; j--) {
            if (messages[j].role === 'user') {
              lastUserMessage = messages[j];
              break;
            }
          }
          break;
        }
      }

      if (lastUserMessage && lastAssistantMessage) {
        const userText = extractTextFromMessage(lastUserMessage);
        const assistantText = extractTextFromMessage(lastAssistantMessage);

        if (userText && assistantText) {
          setDynamicSuggestions([]);
          setIsFetchingSuggestions(true);

          fetchSuggestions(userText, assistantText).then((suggestions) => {
            setDynamicSuggestions(suggestions);
            setIsFetchingSuggestions(false);
          });
        }
      }
    }
  }, [status, messages, setDynamicSuggestions, setIsFetchingSuggestions]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      if (!input.trim()) return;

      setDynamicSuggestions([]);

      const messageText = input;
      setInput('');

      await sendMessage({ text: messageText });
    },
    [input, setDynamicSuggestions, sendMessage]
  );

  const handleSuggestionClick = useCallback(
    async (question: string) => {
      setDynamicSuggestions([]);
      setInput('');

      await sendMessage({ text: question });
    },
    [setDynamicSuggestions, sendMessage]
  );

  const handleResetConversation = useCallback(() => {
    setMessages([]);
    setInput('');
    setDynamicSuggestions([]);
    setIsFetchingSuggestions(false);
  }, [setMessages, setDynamicSuggestions, setIsFetchingSuggestions]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [setIsOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  return {
    // State
    isOpen,
    messages,
    input,
    isLoading,
    error,
    isChatStarted,
    suggestedQuestions: SUGGESTED_QUESTIONS,
    dynamicSuggestions,
    isFetchingSuggestions,

    // Actions
    handleInputChange,
    handleSubmit,
    handleResetConversation,
    handleSuggestionClick,
    setInput,
    toggleOpen,
    handleClose,
  };
}

export default useAdminChatbot;
