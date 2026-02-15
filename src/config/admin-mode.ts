/**
 * 管理モード設定
 *
 * ビルド時に環境変数 NEXT_PUBLIC_ADMIN_MODE で決定される
 * - true: 管理機能（/admin配下）が有効
 * - false: 管理機能が無効（404を返す）、職員セレクターも非表示
 */
export const isAdminMode =
  process.env.NEXT_PUBLIC_ADMIN_MODE === 'true' ||
  process.env.NEXT_PUBLIC_ADMIN_MODE === '1';
