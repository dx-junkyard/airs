/**
 * LINE Messaging API設定
 */
export const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

/**
 * アプリケーションのベースURL
 * APP_URL > VERCEL_PROJECT_PRODUCTION_URL > localhost の優先順位
 */
export function getAppUrl(): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'http://localhost:3000';
}

/**
 * LINE設定が有効かどうかを確認
 */
export function isLineConfigured(): boolean {
  return !!(lineConfig.channelAccessToken && lineConfig.channelSecret);
}
