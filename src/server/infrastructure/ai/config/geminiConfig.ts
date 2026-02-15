import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createVertex } from '@ai-sdk/google-vertex';

/**
 * AI Provider Instance
 *
 * K_SERVICE 環境変数の有無でプロバイダを自動切り替え:
 * - K_SERVICE あり（Cloud Run上）→ Vertex AI（サービスアカウント認証）
 * - K_SERVICE なし（ローカル/Vercel等）→ Google AI（APIキー認証）
 */
const isGCP = !!process.env.K_SERVICE;

const provider = isGCP ? createVertex() : createGoogleGenerativeAI();

/**
 * Gemini Model Configuration
 *
 * Vercel AI SDK用のGeminiモデル設定
 */
export const geminiModel = provider('gemini-3-flash-preview');

/**
 * Gemini 3 Flash Agentic Vision Model
 *
 * geminiModelと同一モデルを使用。Agentic Vision有効時は
 * generateText呼び出しでcodeExecutionツールとthinkingConfigを渡す。
 */
export const geminiVisionModel = provider('gemini-3-flash-preview');

/**
 * Code Execution Tool
 *
 * Agentic Vision等で使用するコード実行ツール。
 * プロバイダに応じて適切なインスタンスを返す。
 */
export const codeExecutionTool = isGCP
  ? createVertex().tools.codeExecution({})
  : createGoogleGenerativeAI().tools.codeExecution({});

/**
 * Agentic Vision用プロバイダオプション
 *
 * thinkingLevel: medium でバランスの取れた推論深度を設定
 */
export const visionProviderOptions = {
  google: {
    thinkingConfig: {
      thinkingLevel: 'medium' as const,
    },
  },
};

/**
 * モデル設定
 */
export const modelConfig = {
  maxTokens: 32_768,
  temperature: 0.3,
};
