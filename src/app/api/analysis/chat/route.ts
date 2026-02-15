import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  stepCountIs,
} from 'ai';
import type { ModelMessage } from 'ai';
import {
  geminiModel,
  modelConfig,
} from '@/server/infrastructure/ai/config/geminiConfig';
import { runSqlTool } from '@/server/infrastructure/ai/tools/runSqlTool';
import { searchReportsTool } from '@/server/infrastructure/ai/tools/searchReportsTool';
import { searchLandmarksTool } from '@/server/infrastructure/ai/tools/searchLandmarksTool';
import { SYSTEM_PROMPT } from '@/features/analysis/utils/dataDictionary';
import { getSystemSetting } from '@/features/system-setting/actions';

export const maxDuration = 300;

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
    // Extract text content from parts
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

/**
 * レイヤーコンテキストからシステムプロンプトの追加セクションを構築
 */
function buildLayerContextPrompt(layerContext: {
  activeStatuses?: string[];
  activeAnimalTypes?: string[];
  activeStaffIds?: string[] | null;
}): string {
  const lines: string[] = [];
  lines.push('\n\n## 現在の地図フィルター設定\n');
  lines.push('ユーザーが現在地図上で表示しているデータのフィルター条件です。');
  lines.push(
    '「地図上のデータを分析して」「表示中のデータ」など、地図に表示中のデータに関する質問の場合は、以下のフィルター条件をSQLのWHERE句に含めてください。\n'
  );

  if (layerContext.activeStatuses && layerContext.activeStatuses.length > 0) {
    const vals = layerContext.activeStatuses.map((s) => `'${s}'`).join(', ');
    lines.push(`- 通報ステータス: ${vals}`);
    lines.push(`  → WHERE条件: status IN (${vals})`);
  }

  if (
    layerContext.activeAnimalTypes &&
    layerContext.activeAnimalTypes.length > 0
  ) {
    const vals = layerContext.activeAnimalTypes.map((s) => `'${s}'`).join(', ');
    lines.push(`- 獣種: ${vals}`);
    lines.push(`  → WHERE条件: "animalType" IN (${vals})`);
  }

  if (
    layerContext.activeStaffIds !== null &&
    layerContext.activeStaffIds !== undefined
  ) {
    const hasUnassigned =
      layerContext.activeStaffIds.includes('__unassigned__');
    const staffIds = layerContext.activeStaffIds.filter(
      (id) => id !== '__unassigned__'
    );
    const conditions: string[] = [];
    if (staffIds.length > 0) {
      conditions.push(
        `"staffId" IN (${staffIds.map((s) => `'${s}'`).join(', ')})`
      );
    }
    if (hasUnassigned) {
      conditions.push(`"staffId" IS NULL`);
    }
    if (conditions.length > 0) {
      lines.push(`- 担当職員フィルター: ${conditions.join(' OR ')}`);
      lines.push(
        '  ※ reportsテーブルには "staffId" TEXT カラム（NULL可、staffsテーブルへの外部キー）があります'
      );
    }
  } else {
    lines.push('- 担当職員: 全職員（フィルターなし）');
  }

  return lines.join('\n');
}

export async function POST(req: Request) {
  const { messages, layerContext } = await req.json();

  // Fetch system setting for domain knowledge
  const setting = await getSystemSetting();
  const domainKnowledge = setting?.value.domainKnowledgeText || '';

  // 現在日付をJST（日本時間）で取得
  const now = new Date();
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayStr = jstDate.toISOString().slice(0, 10); // YYYY-MM-DD

  // Build system prompt with optional domain knowledge and layer context
  const systemPrompt =
    SYSTEM_PROMPT +
    `\n\n## 現在の日付\n\n今日の日付は **${todayStr}** です。「今月」「先月」「最近1週間」などの相対的な日付指定は、この日付を基準に計算してください。` +
    (domainKnowledge
      ? `\n\n## ドメイン知識（分析の判断基準として活用すること）\n\n${domainKnowledge}`
      : '') +
    (layerContext ? buildLayerContextPrompt(layerContext) : '');

  // Convert UI messages to model messages
  const modelMessages = convertUIMessagesToModel(messages as UIMessage[]);

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        try {
          const result = streamText({
            model: geminiModel,
            system: systemPrompt,
            messages: modelMessages,
            tools: {
              runSql: runSqlTool,
              searchReports: searchReportsTool,
              searchLandmarks: searchLandmarksTool,
            },
            stopWhen: stepCountIs(5),
            ...modelConfig,
            onStepFinish({ toolResults }) {
              for (const toolResult of toolResults) {
                // searchReports → data-filters
                if (
                  toolResult.toolName === 'searchReports' &&
                  toolResult.output &&
                  typeof toolResult.output === 'object' &&
                  'success' in toolResult.output &&
                  toolResult.output.success &&
                  'data' in toolResult.output &&
                  Array.isArray(toolResult.output.data)
                ) {
                  const input = toolResult.input as
                    | {
                        startDate?: string;
                        endDate?: string;
                        statuses?: string[];
                        animalTypes?: string[];
                        lat?: number;
                        lng?: number;
                        zoom?: number;
                        staffIds?: string[];
                      }
                    | undefined;

                  // ビューポート: AIが明示的にlat/lngを指定した場合のみ地図を移動
                  // 場所指定がない場合はユーザーの現在のビューポートを維持する
                  const hasLocation = input?.lat != null && input?.lng != null;

                  writer.write({
                    type: 'data-filters',
                    data: {
                      startDate: input?.startDate ?? null,
                      endDate: input?.endDate ?? null,
                      statuses: input?.statuses ?? null,
                      animalTypes: input?.animalTypes ?? null,
                      staffIds: input?.staffIds ?? null,
                      lat: hasLocation ? input!.lat : null,
                      lng: hasLocation ? input!.lng : null,
                      zoom: hasLocation ? (input!.zoom ?? 12) : null,
                    },
                  });
                }

                // searchLandmarks → data-landmarks (変更なし)
                if (
                  toolResult.toolName === 'searchLandmarks' &&
                  toolResult.output &&
                  typeof toolResult.output === 'object' &&
                  'success' in toolResult.output &&
                  toolResult.output.success &&
                  'landmarks' in toolResult.output &&
                  Array.isArray(toolResult.output.landmarks) &&
                  toolResult.output.landmarks.length > 0
                ) {
                  writer.write({
                    type: 'data-landmarks',
                    data: toolResult.output.landmarks,
                  });
                }

                // runSql → イベント送信なし（集計専用）
              }
            },
          });

          result.consumeStream();

          writer.merge(result.toUIMessageStream());
        } catch (error) {
          const isPrismaPoolError =
            error instanceof Error &&
            'code' in error &&
            (error as { code: string }).code === 'P2024';

          if (isPrismaPoolError) {
            console.error('[AnalysisChat] Connection pool exhausted:', error);
          } else {
            console.error('[AnalysisChat] Unexpected error:', error);
          }

          writer.write({
            type: 'error',
            errorText:
              'サーバが混み合っています。しばらく待ってから再度お試しください。',
          });
        }
      },
    }),
  });
}
