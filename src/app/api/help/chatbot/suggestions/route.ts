import { generateText } from 'ai';
import {
  geminiModel,
  modelConfig,
} from '@/server/infrastructure/ai/config/geminiConfig';

export const maxDuration = 30;

interface SuggestionsRequest {
  lastUserQuestion: string;
  lastAssistantResponse: string;
}

interface SuggestionsResponse {
  suggestions: string[];
}

const SUGGESTIONS_SYSTEM_PROMPT = `あなたは野生動物目撃通報AI管理システム「AIRS」のヘルプアシスタントです。
ユーザーの質問と、それに対する回答を踏まえて、次にユーザーが興味を持ちそうな関連質問を3つ提案してください。

## 提案ルール

1. 直前の質問・回答の文脈を踏まえた、自然な深掘りや別の切り口の質問を提案する
2. 回答に含まれる具体的な機能名や操作手順を活用して質問を具体的にする
3. システムの使い方に関する質問のみ提案する
4. 重複や類似の質問を避ける
5. 日本語で簡潔に（30文字以内程度）

## 対象トピック

- LINEからの通報方法
- AI獣害通報（ブラウザ版）
- 通報完了後の確認・編集（編集リンク）
- 地図での確認方法
- 統計ダッシュボード
- 対応している動物種別
- 通報の流れ

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

    const result = await generateText({
      model: geminiModel,
      system: SUGGESTIONS_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: modelConfig.temperature,
    });

    const responseText = result.text.trim();
    const jsonText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(jsonText) as SuggestionsResponse;

    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      throw new Error('Invalid response format');
    }

    const suggestions = parsed.suggestions.slice(0, 3);

    return Response.json({ suggestions });
  } catch (error) {
    console.error('Failed to generate help suggestions:', error);
    return Response.json(
      { error: 'おすすめ質問の生成に失敗しました', suggestions: [] },
      { status: 500 }
    );
  }
}
