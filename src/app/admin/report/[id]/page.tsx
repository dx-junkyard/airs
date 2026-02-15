import { notFound } from 'next/navigation';
import { getReport } from '@/features/report/actions';
import { getEventByReportId } from '@/features/event/actions';
import { getEnabledAnimalTypes } from '@/features/system-setting/actions';
import { getStaffs } from '@/features/staff/actions';
import { getSelectedStaffIdFromCookie } from '@/features/staff/utils/staffCookie';
import { getSharedFacilities } from '@/features/facility/actions';
import SharedFacilitiesHydrator from '@/features/facility/components/SharedFacilitiesHydrator';
import ReportDetailClient from './ReportDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;

  // SSR時にデータを取得（通報、イベント、有効獣種、職員一覧、選択中職員IDを並列で取得）
  const [report, event, enabledAnimalTypes, staffs, selectedStaffId, sharedFacilities] =
    await Promise.all([
      getReport(id),
      getEventByReportId(id),
      getEnabledAnimalTypes(),
      getStaffs('asc'),
      getSelectedStaffIdFromCookie(),
      getSharedFacilities(),
    ]);

  // レポートが見つからない場合は404
  if (!report) {
    notFound();
  }

  return (
    <>
      <SharedFacilitiesHydrator facilities={sharedFacilities} />
      <ReportDetailClient
        report={report}
        event={event}
        enabledAnimalTypes={enabledAnimalTypes}
        staffs={staffs}
        selectedStaffId={selectedStaffId}
      />
    </>
  );
}
