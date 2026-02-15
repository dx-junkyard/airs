/**
 * 静的ページのタイトル定義
 */
export const staticPageTitles: Record<string, string> = {
  '/': '統計ダッシュボード',
  '/report': '通報編集',
  '/admin/report': '通報管理',
  '/admin/report/new': '新規通報作成',
  '/map': '地図表示',
  '/ai-report': 'AI獣害通報',
  '/admin/staff': '職員管理',
  '/admin/staff/new': '職員新規作成',
  '/admin/facility': '周辺施設管理',
  '/admin/bulk-actions': '一括操作',
  '/admin/settings': 'システム設定',
  '/admin/help': '管理者用ヘルプ',
  '/settings': '設定',
  '/line': 'LINE公式アカウント',
  '/help': 'ヘルプ',
};

/**
 * 動的ページのタイトル生成関数の型
 */
export type DynamicTitleGenerator = (pathname: string) => string | null;

/**
 * 動的ページのタイトル生成関数
 */
export const dynamicPageTitles: DynamicTitleGenerator[] = [
  // 通報詳細 /admin/report/[id]
  (pathname) => {
    const match = pathname.match(/^\/admin\/report\/([^/]+)$/);
    return match ? '通報詳細' : null;
  },
  // 職員詳細 /admin/staff/[id]
  (pathname) => {
    const match = pathname.match(/^\/admin\/staff\/([^/]+)$/);
    return match && match[1] !== 'new' ? '職員詳細' : null;
  },
];

/**
 * pathnameから該当するタイトルを取得
 */
export function getPageTitle(pathname: string): string | null {
  // 静的ページタイトルを優先チェック
  if (pathname in staticPageTitles) {
    return staticPageTitles[pathname];
  }

  // 動的ページタイトルをチェック
  for (const generator of dynamicPageTitles) {
    const title = generator(pathname);
    if (title) return title;
  }

  return null;
}
