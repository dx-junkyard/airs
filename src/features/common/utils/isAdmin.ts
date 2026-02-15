/**
 * 現在の環境がadminモードかどうかを判定する
 * NEXT_PUBLIC_ADMIN_MODE=1 の場合にtrueを返す
 */
export function isAdmin(): boolean {
  return process.env.NEXT_PUBLIC_ADMIN_MODE === '1';
}

/**
 * adminモードでない場合にエラーをスローする
 */
export function requireAdmin(): void {
  if (!isAdmin()) {
    throw new Error('アクセス権限がありません');
  }
}
