import { generateText } from 'ai';
import {
  geminiModel,
  modelConfig,
} from '@/server/infrastructure/ai/config/geminiConfig';
import { getSystemSetting } from '@/features/system-setting/actions';

export const maxDuration = 30;

interface SuggestionsRequest {
  lastUserQuestion: string;
  lastAssistantResponse: string;
}

interface SuggestionsResponse {
  suggestions: string[];
}

const SUGGESTIONS_SYSTEM_PROMPT = `あなたは野生動物目撃通報データベースの分析エキスパートです。
ユーザーの質問と、それに対する回答を踏まえて、次にユーザーが興味を持ちそうな関連質問を3つ提案してください。

## 質問の2タイプ

提案する質問は以下の2タイプを意識し、バランスよく混ぜること:

- **検索タイプ**: 「〇〇を探して」「〇〇を表示して」— 該当する通報を絞り込んで地図・一覧で確認する
- **分析タイプ**: 「〇〇を分析して」「〇〇の傾向は？」— 集計・比較で傾向や洞察を得る

## 提案ルール

1. 直前の質問・回答の文脈を踏まえた、自然な深掘りや別の切り口の質問を提案する
2. 回答に含まれる具体的な数値や地域名、動物種別を活用して質問を具体的にする
3. 3つのうち少なくとも1つは分析タイプ、1つは検索タイプにする
4. 重複や類似の質問を避ける
5. 日本語で簡潔に（30文字以内程度）

## 利用可能なデータ

- 動物種別: サル、シカ、イノシシ、クマ、タヌキ、キツネ、アライグマ、カラス、その他
- 対応状況: 確認待ち、確認完了
- 地域情報: 都道府県、市区町村、丁目
- 時間情報: 作成日時、更新日時
- その他: 通報件数、画像の有無

## 出力形式

JSON形式で以下のように出力してください:
{
  "suggestions": [
    "質問1",
    "質問2",
    "質問3"
  ]
}

必ずJSON形式のみを出力し、それ以外のテキストは含めないでください。`;

function buildSuggestionSystemPrompt(domainKnowledge: string): string {
  if (!domainKnowledge) {
    return SUGGESTIONS_SYSTEM_PROMPT;
  }

  return (
    SUGGESTIONS_SYSTEM_PROMPT +
    `\n\n## ドメイン知識（提案の判断基準として活用すること）\n\n${domainKnowledge}`
  );
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as SuggestionsRequest;
    const { lastUserQuestion, lastAssistantResponse } = body;

    if (!lastUserQuestion || !lastAssistantResponse) {
      return Response.json(
        { error: '質問と回答が必要です' },
        { status: 400 }
      );
    }

    const userPrompt = `## 直前のやり取り

### ユーザーの質問
${lastUserQuestion}

### AIの回答
${lastAssistantResponse}

---

上記のやり取りを踏まえて、次にユーザーが興味を持ちそうな関連質問を3つ提案してください。`;

    const setting = await getSystemSetting();
    const domainKnowledge = setting?.value.domainKnowledgeText || '';
    const systemPrompt = buildSuggestionSystemPrompt(domainKnowledge);

    const result = await generateText({
      model: geminiModel,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: modelConfig.temperature,
    });

    // Parse JSON response
    const responseText = result.text.trim();
    // Remove markdown code blocks if present
    const jsonText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(jsonText) as SuggestionsResponse;

    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      throw new Error('Invalid response format');
    }

    // Ensure we have exactly 3 suggestions
    const suggestions = parsed.suggestions.slice(0, 3);

    return Response.json({ suggestions });
  } catch (error) {
    console.error('Failed to generate suggestions:', error);
    return Response.json(
      { error: 'おすすめ質問の生成に失敗しました', suggestions: [] },
      { status: 500 }
    );
  }
}
