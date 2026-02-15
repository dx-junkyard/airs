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

const SUGGESTIONS_SYSTEM_PROMPT = `あなたは野生動物目撃通報AI管理システム「AIRS」の管理者向けヘルプアシスタントです。
管理者の質問と、それに対する回答を踏まえて、次に管理者が興味を持ちそうな関連質問を3つ提案してください。

## 提案ルール

1. 直前の質問・回答の文脈を踏まえた、自然な深掘りや別の切り口の質問を提案する
2. 回答に含まれる具体的な機能名や操作手順を活用して質問を具体的にする
3. システムの管理・運用に関する質問のみ提案する
4. 重複や類似の質問を避ける
5. 日本語で簡潔に（30文字以内程度）

## 対象トピック

- 通報管理（検索・フィルタリング・ステータス変更・担当者割当）
- 地図機能（タイムライン・ヒートマップ・クラスター表示）
- 通報グループ
- 職員管理
- AI データ分析
- 統計ダッシュボード
- システム設定
- LINE通報の仕組み（通報完了後の編集リンク発行を含む）

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

### 管理者の質問
${lastUserQuestion}

### AIの回答
${lastAssistantResponse}

---

上記のやり取りを踏まえて、次に管理者が興味を持ちそうな関連質問を3つ提案してください。`;

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
    console.error('Failed to generate admin suggestions:', error);
    return Response.json(
      { error: 'おすすめ質問の生成に失敗しました', suggestions: [] },
      { status: 500 }
    );
  }
}
