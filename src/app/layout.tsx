import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';

// Font Awesome: CSSの動的挿入を無効化し、静的にインポート
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;

import { Providers } from './providers';
import AppLayout from '@/components/layout/AppLayout';
import StaffSelector from '@/features/staff/components/StaffSelector';
import { getSelectedStaffIdFromCookie } from '@/features/staff/utils/staffCookie';
import { getStaffs } from '@/features/staff/actions';
import { APP_TITLE } from '@/config/app-branding';
import { resolveBreadcrumbOverrides } from '@/config/breadcrumb-resolvers';
import { isAdminMode } from '@/config/admin-mode';

export const metadata: Metadata = {
  title: APP_TITLE,
  description: 'LINEからの通報をAIで効率的に管理する統合プラットフォーム',
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';

  const [selectedStaffId, breadcrumbOverrides, staffs] = await Promise.all([
    getSelectedStaffIdFromCookie(),
    resolveBreadcrumbOverrides(pathname),
    isAdminMode ? getStaffs() : Promise.resolve([]),
  ]);

  const staffSelectorSlot = isAdminMode ? (
    <StaffSelector selectedStaffId={selectedStaffId} staffs={staffs} />
  ) : null;

  return (
    <html lang="ja" data-scroll-behavior="smooth">
      <body>
        <Providers>
          <AppLayout
            staffSelector={staffSelectorSlot}
            breadcrumbOverrides={breadcrumbOverrides}
          >
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
