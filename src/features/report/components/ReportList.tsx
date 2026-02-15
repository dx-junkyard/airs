import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import Ul from '@/components/ui/Ul/Ul';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import ReportListItem from './ReportListItem';

interface ReportListProps {
  reports: ReportDto[];
}

/**
 * 通報リスト（Server Component）
 *
 * 通報一覧のリスト表示を担当。純粋なレンダリングのみでSSR対応。
 * ページネーションは親コンポーネント（CSR）で管理。
 */
export default function ReportList({ reports }: ReportListProps) {
  if (reports.length === 0) {
    return (
      <EmptyState
        message="通報がありません"
        description="検索条件を変更するか、フィルターをクリアしてお試しください"
      />
    );
  }

  return (
    <Ul unstyled className="space-y-4">
      {reports.map((report) => (
        <ReportListItem key={report.id} report={report} />
      ))}
    </Ul>
  );
}
