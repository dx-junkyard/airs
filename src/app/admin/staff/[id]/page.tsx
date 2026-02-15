export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getStaff, getStaffLocations } from '@/features/staff/actions';
import { searchReportsWithPagination } from '@/features/report/actions';
import { getSelectedStaffIdFromCookie } from '@/features/staff/utils/staffCookie';
import { getSharedFacilities } from '@/features/facility/actions';
import SharedFacilitiesHydrator from '@/features/facility/components/SharedFacilitiesHydrator';
import StaffDetailClient from './StaffDetailClient';


const REPORTS_PER_PAGE = 10;

/** デフォルトのステータスフィルター（確認待ち） */
const DEFAULT_REPORT_STATUS = 'waiting';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reportPage?: string; reportStatus?: string }>;
}

export default async function StaffDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const reportPage = resolvedSearchParams.reportPage
    ? parseInt(resolvedSearchParams.reportPage, 10)
    : 1;
  const reportStatus =
    resolvedSearchParams.reportStatus ?? DEFAULT_REPORT_STATUS;

  // SSR時にデータを取得
  const [staff, selectedStaffId, reportsResult, staffLocations, sharedFacilities] =
    await Promise.all([
      getStaff(id),
      getSelectedStaffIdFromCookie(),
      searchReportsWithPagination({
        staffId: id,
        status: reportStatus || undefined,
        page: reportPage,
        limit: REPORTS_PER_PAGE,
        sortOrder: 'desc',
      }),
      getStaffLocations(id),
      getSharedFacilities(),
    ]);

  // 職員が見つからない場合は404
  if (!staff) {
    notFound();
  }

  return (
    <>
      <SharedFacilitiesHydrator facilities={sharedFacilities} />
      <StaffDetailClient
        staff={staff}
        selectedStaffId={selectedStaffId}
        reports={reportsResult.reports}
        totalCount={reportsResult.totalCount}
        totalPages={reportsResult.totalPages}
        currentPage={reportsResult.currentPage}
        staffLocations={staffLocations}
      />
    </>
  );
}
