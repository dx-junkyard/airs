'use client';

import { useChat } from '@ai-sdk/react';
import type { UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import type { NearbyLandmarkDto } from '@/server/application/dtos/NearbyLandmarkDto';
import {
  dynamicSuggestionsAtom,
  isFetchingSuggestionsAtom,
  aiLandmarkResultsAtom,
  chatResetRequestAtom,
  expandedTableIdAtom,
  aiSelectedPointAtom,
} from '@/features/analysis/atoms/analysisAtoms';
import { SUGGESTED_QUESTIONS } from '@/features/analysis/utils/dataDictionary';
import {
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
} from '@/features/analysis/utils/chatHistoryStorage';

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
    const response = await fetch('/api/analysis/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lastUserQuestion,
        lastAssistantResponse,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch suggestions');
    }

    const data = (await response.json()) as { suggestions: string[] };
    return data.suggestions || [];
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return [];
  }
}

/**
 * 地図レイヤーのフィルター状態（AIコンテキスト用）
 */
export interface LayerContext {
  /** ON状態の通報ステータス (e.g., ['waiting', 'completed']) */
  activeStatuses: string[];
  /** ON状態の獣種 (e.g., ['monkey', 'deer']) */
  activeAnimalTypes: string[];
  /** ON状態の職員ID (null = 全表示, string[] = 指定のみ。'__unassigned__' は未割当) */
  activeStaffIds: string[] | null;
}

/**
 * useAnalysisChat
 *
 * 分析チャットの状態とアクションを管理するカスタムフック
 */
export function useAnalysisChat(
  layerContext?: LayerContext,
  onFilterChange?: (filters: Record<string, unknown>) => void,
) {
  const [dynamicSuggestions, setDynamicSuggestions] = useAtom(
    dynamicSuggestionsAtom
  );
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useAtom(
    isFetchingSuggestionsAtom
  );

  const setAiLandmarkResults = useSetAtom(aiLandmarkResultsAtom);
  const [chatResetRequest, setChatResetRequest] = useAtom(chatResetRequestAtom);
  const setExpandedTableId = useSetAtom(expandedTableIdAtom);
  const setAiSelectedPoint = useSetAtom(aiSelectedPointAtom);

  // Local input state
  const [input, setInput] = useState('');

  // Ref for onFilterChange to avoid stale closures in onData
  const onFilterChangeRef = useRef(onFilterChange);
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  // Track previous status to detect completion
  const prevStatusRef = useRef<string>('ready');

  // Serialize layerContext for stable memoization
  const layerContextJson = layerContext ? JSON.stringify(layerContext) : '';

  // localStorageから初期メッセージを読み込み（マウント時1回のみ）
  const [initialMessages] = useState(() => loadChatHistory());

  // Create transport with custom API endpoint (includes layerContext in body)
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/analysis/chat',
        ...(layerContextJson
          ? { body: { layerContext: JSON.parse(layerContextJson) } }
          : {}),
      }),
    [layerContextJson]
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    messages: initialMessages.length > 0 ? initialMessages : undefined,
    transport,
    onData: (dataPart) => {
      if (dataPart.type === 'data-filters') {
        onFilterChangeRef.current?.(dataPart.data as Record<string, unknown>);
      }
      if (dataPart.type === 'data-landmarks') {
        setAiLandmarkResults((prev) => [
          ...prev,
          ...(dataPart.data as NearbyLandmarkDto[]),
        ]);
      }
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // チャットリセット要求の監視
  useEffect(() => {
    if (!chatResetRequest) return;
    setMessages([]);
    clearChatHistory();
    setDynamicSuggestions([]);
    setIsFetchingSuggestions(false);
    setExpandedTableId(null);
    setAiSelectedPoint(null);
    setChatResetRequest(false);
  }, [
    chatResetRequest,
    setChatResetRequest,
    setMessages,
    setDynamicSuggestions,
    setIsFetchingSuggestions,
    setExpandedTableId,
    setAiSelectedPoint,
  ]);

  // 派生状態: messages.lengthから直接計算
  const isChatStarted = messages.length > 0;
  const showSuggestions = messages.length === 0;

  /**
   * ストリーミング完了時にlocalStorageへメッセージを保存
   */
  useEffect(() => {
    const wasStreaming =
      prevStatusRef.current === 'streaming' ||
      prevStatusRef.current === 'submitted';
    const isNowReady = status === 'ready';

    if (wasStreaming && isNowReady && messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [status, messages]);

  /**
   * ストリーミング完了時におすすめ質問を取得
   */
  useEffect(() => {
    const wasStreaming =
      prevStatusRef.current === 'streaming' ||
      prevStatusRef.current === 'submitted';
    const isNowReady = status === 'ready';

    // Update previous status
    prevStatusRef.current = status;

    // Only fetch when streaming completes
    if (wasStreaming && isNowReady && messages.length >= 2) {
      // Find last user and assistant messages
      const lastAssistantMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'assistant');
      const lastUserMessageIndex = messages.findIndex(
        (m, i) =>
          m.role === 'user' &&
          messages
            .slice(i + 1)
            .some(
              (am) =>
                am.role === 'assistant' && am.id === lastAssistantMessage?.id
            )
      );

      // Find the user message that preceded the last assistant response
      let lastUserMessage: UIMessage | undefined;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (
          messages[i].role === 'assistant' &&
          messages[i].id === lastAssistantMessage?.id
        ) {
          // Found the assistant message, now look for the preceding user message
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
          // Clear previous suggestions and start fetching
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

  /**
   * 入力値変更ハンドラ
   */
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  /**
   * メッセージ送信処理
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }
      if (!input.trim()) return;

      // Clear dynamic suggestions when user sends a new message
      setDynamicSuggestions([]);

      const messageText = input;
      setInput('');

      await sendMessage({ text: messageText });
    },
    [input, setDynamicSuggestions, sendMessage]
  );

  /**
   * 会話履歴をリセット
   */
  const handleResetConversation = useCallback(() => {
    setInput('');
    setChatResetRequest(true);
  }, [setChatResetRequest]);

  /**
   * おすすめ質問を送信
   */
  const handleSuggestionClick = useCallback(
    async (question: string) => {
      setDynamicSuggestions([]);
      setInput('');

      await sendMessage({ text: question });
    },
    [setDynamicSuggestions, sendMessage]
  );

  return {
    // State
    messages,
    input,
    isLoading,
    error,
    isChatStarted,
    showSuggestions,
    suggestedQuestions: SUGGESTED_QUESTIONS,
    dynamicSuggestions,
    isFetchingSuggestions,

    // Actions
    handleInputChange,
    handleSubmit,
    handleResetConversation,
    handleSuggestionClick,
    setInput,
  };
}

export default useAnalysisChat;
