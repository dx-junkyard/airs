import CsvImportSection from '@/features/admin/components/CsvImportSection';
import BulkActionHistorySection from '@/features/admin/components/BulkActionHistorySection';
import BulkActionHydrator from '@/features/admin/components/BulkActionHydrator';
import {
  getLatestBulkAction,
  getBulkActionHistory,
} from '@/features/admin/actions';

export default async function BulkActionsPage() {
  const [latestBulkAction, history] = await Promise.all([
    getLatestBulkAction('csv-import'),
    getBulkActionHistory(),
  ]);

  return (
    <div className="space-y-6">
      <BulkActionHydrator data={latestBulkAction} />
      <CsvImportSection />
      <BulkActionHistorySection history={history} />
    </div>
  );
}
