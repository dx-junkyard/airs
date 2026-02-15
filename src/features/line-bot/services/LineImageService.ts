import LineMessagingClient from '@/server/infrastructure/line/LineMessagingClient';
import DIContainer from '@/server/infrastructure/di/container';

/**
 * LINE画像処理サービス
 *
 * LINEから送信された画像をダウンロードし、Vercel Blobにアップロードする
 */

/**
 * LINE画像メッセージをVercel Blobにアップロード
 *
 * @param messageId LINEメッセージID
 * @param lineClient LineMessagingClient
 * @returns アップロードされた画像のURL
 */
export async function uploadLineImage(
  messageId: string,
  lineClient: LineMessagingClient
): Promise<string> {
  // LINE APIから画像バイナリを取得
  const stream = await lineClient.getMessageContent(messageId);

  // ReadableStreamをBufferに変換
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);

  // BlobからFileオブジェクトを作成
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  const filename = `line_${messageId}_${Date.now()}.jpg`;

  // Vercel Blobにアップロード
  const imageRepository = DIContainer.getImageRepository();
  const url = await imageRepository.upload(blob, filename);

  return url;
}
