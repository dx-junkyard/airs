import { notFound } from 'next/navigation';
import { isAdminMode } from '@/config/admin-mode';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // 管理モードでない場合は404
  if (!isAdminMode) {
    notFound();
  }

  return <>{children}</>;
}
