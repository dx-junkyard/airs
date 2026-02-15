import type { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { APP_TITLE } from '@/config/app-branding';

export const metadata: Metadata = {
  title: `地図表示 | ${APP_TITLE}`,
  description: '通報データをGIS風の地図で表示・フィルタリング',
};

/**
 * 地図ページ専用レイアウト
 * サイドバーなし、フルスクリーン表示
 */
const MapLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <NuqsAdapter>
      <div className="h-screen overflow-hidden">{children}</div>
    </NuqsAdapter>
  );
};

export default MapLayout;
