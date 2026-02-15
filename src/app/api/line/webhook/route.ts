import { NextResponse } from 'next/server';

import { verifyLineSignature } from '@/features/line-bot/utils/signatureVerifier';
import {
  lineConfig,
  isLineConfigured,
} from '@/server/infrastructure/line/lineConfig';
import LineMessagingClient from '@/server/infrastructure/line/LineMessagingClient';
import DIContainer from '@/server/infrastructure/di/container';
import HandleLineWebhookUseCase from '@/server/application/use-cases/line/HandleLineWebhookUseCase';
import type { LineEventInput } from '@/features/line-bot/types/lineMessages';

/**
 * LINE Webhook受信エンドポイント
 *
 * 1. x-line-signature で署名検証
 * 2. 200 OK 即時返却（LINE再送防止）
 * 3. 非同期でイベント処理
 */
export async function POST(request: Request): Promise<Response> {
  console.log('[LINE Webhook] POST received');

  // 設定チェック
  if (!isLineConfigured()) {
    console.error('[LINE Webhook] LINE configuration is missing');
    return NextResponse.json(
      { error: 'LINE is not configured' },
      { status: 500 }
    );
  }

  // リクエストボディを取得
  const body = await request.text();
  console.log('[LINE Webhook] Body:', body.slice(0, 500));

  // 署名検証
  const signature = request.headers.get('x-line-signature');
  if (!signature) {
    console.error('[LINE Webhook] Missing signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  try {
    const isValid = verifyLineSignature(
      body,
      signature,
      lineConfig.channelSecret
    );
    if (!isValid) {
      console.error('[LINE Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
  } catch (error) {
    console.error('[LINE Webhook] Signature verification error:', error);
    return NextResponse.json(
      { error: 'Signature verification failed' },
      { status: 403 }
    );
  }

  console.log('[LINE Webhook] Signature verified');

  // イベント解析
  const payload = JSON.parse(body) as WebhookPayload;
  const events = payload.events || [];
  console.log('[LINE Webhook] Events count:', events.length);

  // イベント処理を同期的に実行してからレスポンスを返す
  // replyTokenの有効期限内に確実に返信するため
  await processEventsAsync(events);

  return NextResponse.json({ status: 'ok' });
}

/**
 * LINE Webhook URLの検証（GET）
 */
export async function GET(): Promise<Response> {
  return NextResponse.json({ status: 'ok' });
}

// ============================================================
// 型定義
// ============================================================

interface WebhookPayload {
  events: WebhookEvent[];
}

interface WebhookEvent {
  type: string;
  webhookEventId?: string;
  deliveryContext?: {
    isRedelivery: boolean;
  };
  replyToken?: string;
  markAsReadToken?: string;
  source?: {
    type: string;
    userId?: string;
  };
  message?: {
    type: string;
    id: string;
    text?: string;
  };
  postback?: {
    data: string;
    params?: {
      datetime?: string;
      date?: string;
      time?: string;
    };
  };
}

// ============================================================
// 非同期イベント処理
// ============================================================

/**
 * ユーザー単位の処理ロック
 * 同一ユーザーのイベントが並行処理されるのを防ぎ、コネクションプール枯渇を回避する
 */
const processingUsers = new Set<string>();

async function processEventsAsync(events: WebhookEvent[]): Promise<void> {
  console.log('[LINE Webhook] Processing events async...');
  const lineClient = new LineMessagingClient();
  const sessionRepo = DIContainer.getLineSessionRepository();
  const useCase = new HandleLineWebhookUseCase(sessionRepo, lineClient);

  for (const event of events) {
    try {
      // 既読をつける
      if (event.markAsReadToken) {
        await lineClient.markAsRead(event.markAsReadToken);
      }

      await processEvent(event, useCase);
    } catch (error) {
      console.error('[LINE Webhook] Error processing event:', error);
    }
  }
}

async function processEvent(
  event: WebhookEvent,
  useCase: HandleLineWebhookUseCase
): Promise<void> {
  console.log('[LINE Webhook] Event type:', event.type, 'source:', JSON.stringify(event.source));

  // 再送イベントはスキップ（LINEタイムアウトによる重複防止）
  if (event.deliveryContext?.isRedelivery) {
    console.log('[LINE Webhook] Skipping redelivered event:', event.webhookEventId);
    return;
  }

  // ユーザーIDとリプライトークンが必須
  const lineUserId = event.source?.userId;
  const replyToken = event.replyToken;

  if (!lineUserId || !replyToken) {
    console.log('[LINE Webhook] Skipping: no userId or replyToken');
    return;
  }

  // 同一ユーザーの並行処理を防止
  if (processingUsers.has(lineUserId)) {
    console.log('[LINE Webhook] Skipping: user already being processed:', lineUserId);
    return;
  }

  // イベント種別ごとにLineEventInputを構築
  const input = extractEventInput(event);
  if (!input) {
    console.log('[LINE Webhook] Skipping: could not extract input from event');
    return;
  }

  processingUsers.add(lineUserId);
  try {
    console.log('[LINE Webhook] Processing input:', JSON.stringify(input));
    await useCase.execute(lineUserId, replyToken, input);
    console.log('[LINE Webhook] Event processed successfully');
  } finally {
    processingUsers.delete(lineUserId);
  }
}

function extractEventInput(event: WebhookEvent): LineEventInput | null {
  if (event.type === 'message' && event.message) {
    const msg = event.message;

    if (msg.type === 'text' && msg.text) {
      return {
        type: 'message',
        text: msg.text,
      };
    }

    if (msg.type === 'image') {
      return {
        type: 'message',
        imageMessageId: msg.id,
      };
    }

    if (msg.type === 'location') {
      // location messageのlatitude/longitudeはmessageオブジェクトに含まれる
      const locMsg = msg as unknown as {
        type: string;
        id: string;
        latitude: number;
        longitude: number;
      };
      return {
        type: 'message',
        location: {
          latitude: locMsg.latitude,
          longitude: locMsg.longitude,
        },
      };
    }

    return null;
  }

  if (event.type === 'postback' && event.postback) {
    return {
      type: 'postback',
      postbackData: event.postback.data,
      postbackParams: event.postback.params
        ? { datetime: event.postback.params.datetime }
        : undefined,
    };
  }

  return null;
}
