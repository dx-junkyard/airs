import crypto from 'crypto';

/**
 * LINE webhook署名検証
 *
 * x-line-signature ヘッダーの HMAC-SHA256 署名を検証する
 */
export function verifyLineSignature(
  body: string,
  signature: string,
  channelSecret: string
): boolean {
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}
