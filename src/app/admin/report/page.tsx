import ReportDashboard from '@/features/report/components/ReportDashboard';
import { searchReportsWithPagination } from '@/features/report/actions';
import { getStaffs } from '@/features/staff/actions';
import {
  getEnabledAnimalTypes,
  getSystemSetting,
} from '@/features/system-setting/actions';
import SystemSettingHydrator from '@/features/system-setting/components/SystemSettingHydrator';


interface SearchParams {
  view?: string;
  status?: string;
  animalType?: string;
  staffId?: string;
  q?: string;
  sort?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
}

const ITEMS_PER_PAGE = 10;
const MAP_MAX_ITEMS = 10000; // 地図表示時の最大件数

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const isMapView = params.view === 'map';

  const startDate = params.startDate || undefined;
  const endDate = params.endDate || undefined;

  // URLパラメータにstaffIdがない場合は全件表示（cookieの選択職員でフィルターしない）
  const defaultStaffId = 'all';

  // SSR時にDBでフィルタリング・ページネーション
  // 地図表示時はページネーションなしで全件取得（最大MAP_MAX_ITEMS件）
  const [result, staffList, enabledAnimalTypes, systemSetting] = await Promise.all([
    searchReportsWithPagination({
      query: params.q || undefined,
      status: params.status || 'all',
      animalType: params.animalType || 'all',
      staffId: params.staffId || defaultStaffId,
      startDate,
      endDate,
      sortOrder: params.sort || 'desc',
      page: isMapView ? 1 : Math.max(1, parseInt(params.page ?? '', 10) || 1),
      limit: isMapView ? MAP_MAX_ITEMS : ITEMS_PER_PAGE,
    }),
    getStaffs(),
    getEnabledAnimalTypes(),
    getSystemSetting(),
  ]);

  const suggestedQuestions: string[] = (() => {
    try {
      const parsed = JSON.parse(
        systemSetting.value.suggestedQuestionsJson ?? '[]'
      );
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
    return [];
  })();

  return (
    <>
      <SystemSettingHydrator setting={systemSetting.value} />
      <ReportDashboard
        reports={result.reports}
        totalCount={result.totalCount}
        totalPages={isMapView ? 1 : result.totalPages}
        currentPage={isMapView ? 1 : result.currentPage}
        appliedStartDate={startDate}
        appliedEndDate={endDate}
        staffList={staffList}
        defaultStaffId={defaultStaffId}
        enabledAnimalTypes={enabledAnimalTypes}
        suggestedQuestions={suggestedQuestions}
      />
    </>
  );
}
