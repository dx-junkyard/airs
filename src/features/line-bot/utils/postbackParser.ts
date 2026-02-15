/**
 * Postback data解析ユーティリティ
 *
 * URL query string形式のpostback dataを解析する
 * 例: "action=select_animal&value=monkey"
 */

export interface PostbackPayload {
  action: string;
  [key: string]: string;
}

/**
 * Postback dataをパースしてオブジェクトに変換
 */
export function parsePostbackData(data: string): PostbackPayload {
  const params = new URLSearchParams(data);
  const result: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  return result as PostbackPayload;
}

/**
 * Postback dataを構築
 */
export function buildPostbackData(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}
