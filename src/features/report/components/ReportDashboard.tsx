'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  useQueryStates,
  parseAsStringLiteral,
  parseAsString,
  parseAsInteger,
  parseAsFloat,
  parseAsBoolean,
} from 'nuqs';
import { useSetAtom } from 'jotai';
import { faList, faMap, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { parseDate } from '@internationalized/date';
import type { DateValue, RangeValue } from 'react-aria-components';
import Button from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import Select from '@/components/ui/Select/Select';
import DateRangePicker from '@/components/ui/DateRangePicker/DateRangePicker';
import { mapFilterParamsAtom } from '@/features/report/atoms/mapFilterParamsAtom';
import PaginatedReportList from './PaginatedReportList';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import type { EstimatedDisplayDays } from '@/features/report/types/timeline';
import { useIsDesktop } from '@/hooks/useMediaQuery';
const MapPage = dynamic(() => import('@/features/map/components/MapPage'), {
  ssr: false,
  loading: () => (
    <div
      className={`
        flex h-125 items-center justify-center rounded-lg bg-solid-gray-50
      `}
    >
      <p className="text-solid-gray-600">地図を読み込み中...</p>
    </div>
  ),
});
import ReportDataPanel from '@/features/map/components/ReportDataPanel';
import type { LayerState } from '@/features/map/components/MapLayerPanel';
import {
  type AnimalTypeValue,
  type AnimalTypeConfig,
  getAnimalTypeLabel,
} from '@/server/domain/constants/animalTypes';
import type { ReportStatusValue } from '@/server/domain/constants/reportStatuses';

// 共通検索UIコンポーネント
import FilterBar from '@/components/ui/Search/FilterBar';
import AdvancedFiltersPanel, {
  AdvancedFilterItem,
} from '@/components/ui/Search/AdvancedFiltersPanel';
import ActiveFilterDisplay from '@/components/ui/Search/ActiveFilterDisplay';
import AdvancedFilterToggleButton from '@/components/ui/Search/AdvancedFilterToggleButton';
import ViewModeToggle from '@/components/ui/Search/ViewModeToggle';
import ToggleSwitch from '@/components/ui/Search/ToggleSwitch';
import type { ActiveFilter } from '@/components/ui/Search/ActiveFilterDisplay';
import { useSearchReports } from '@/hooks/queries/useSearchReports';
import type { SearchReportsParams } from '@/features/report/actions';

const ITEMS_PER_PAGE = 10;
const MAP_MAX_ITEMS = 10000;

// MapPage を直接利用して地図表示を統一

// サイドパネル / 下部ドロワーは廃止（選択詳細は表示しない）

// ステータスラベルマッピング
const STATUS_LABELS: Record<string, string> = {
  waiting: '確認待ち',
  completed: '確認完了',
};

// フィルターオプション定義
const STATUS_OPTIONS = [
  { value: 'all', label: '全ステータス' },
  { value: 'waiting', label: '確認待ち' },
  { value: 'completed', label: '確認完了' },
];

const VIEW_MODE_OPTIONS = [
  { value: 'list' as const, label: 'リスト', icon: faList },
  { value: 'map' as const, label: '地図', icon: faMap },
];

function isSameSearchParams(
  a: SearchReportsParams,
  b: SearchReportsParams
): boolean {
  return (
    a.query === b.query &&
    a.status === b.status &&
    a.animalType === b.animalType &&
    a.staffId === b.staffId &&
    a.startDate === b.startDate &&
    a.endDate === b.endDate &&
    a.sortOrder === b.sortOrder &&
    a.page === b.page &&
    a.limit === b.limit
  );
}

// 担当者ラベル取得用ヘルパー
const getStaffLabel = (staffId: string, staffList: StaffDto[]): string => {
  const staff = staffList.find((s) => s.id === staffId);
  return staff?.name ?? staffId;
};

interface ReportDashboardProps {
  /** SSRで取得・フィルタリング・ページネーション済みのレポート一覧 */
  reports: ReportDto[];
  /** 総件数（フィルター適用後、ページネーション前） */
  totalCount: number;
  /** 総ページ数 */
  totalPages: number;
  /** 現在のページ番号 */
  currentPage: number;
  /** サーバーで適用された開始日（地図モード時のデフォルト含む） */
  appliedStartDate?: string;
  /** サーバーで適用された終了日（地図モード時のデフォルト含む） */
  appliedEndDate?: string;
  /** 職員一覧（担当者フィルター用） */
  staffList: StaffDto[];
  /** 担当者フィルターのデフォルト値（cookieの選択職員ID or 'all'） */
  defaultStaffId?: string;
  /** SSRで取得した有効獣種 */
  enabledAnimalTypes: AnimalTypeConfig[];
  /** 分析AIのおすすめ質問（システム設定から取得） */
  suggestedQuestions?: string[];
}

export default function ReportDashboard({
  reports: initialReports,
  totalCount: initialTotalCount,
  totalPages: initialTotalPages,
  currentPage: initialCurrentPage,
  appliedStartDate,
  appliedEndDate,
  staffList,
  defaultStaffId = 'all',
  enabledAnimalTypes,
  suggestedQuestions,
}: ReportDashboardProps) {
  // PC/スマホ判定（1024px以上でデスクトップ）
  const isDesktop = useIsDesktop();

  // 動的な獣種フィルターオプション
  const animalTypeOptions = useMemo(() => {
    return [
      { value: 'all', label: '全獣種' },
      ...enabledAnimalTypes.map((t) => ({ value: t.id, label: t.label })),
    ];
  }, [enabledAnimalTypes]);

  // レイヤー状態管理（地図表示用）- 有効獣種のみtrueで初期化
  const [layers, setLayers] = useState<LayerState>(() => {
    const animalTypes = {} as Record<AnimalTypeValue, boolean>;
    enabledAnimalTypes.forEach((t) => {
      animalTypes[t.id] = true;
    });
    return {
      statuses: {
        waiting: true,
        completed: true,
      },
      animalTypes,
      visualizations: {
        cluster: true,
        heatmap: true,
      },
    };
  });

  const [layerPanelOpen, setLayerPanelOpen] = useState(true);
  const [dataPanelOpen, setDataPanelOpen] = useState(false);
  const [dataPanelHeight, setDataPanelHeight] = useState<number>(192);

  // 地図の状態をURLで管理（shallow: trueでSSRを発火させない）
  const [mapState, setMapState] = useQueryStates(
    {
      lat: parseAsFloat,
      lng: parseAsFloat,
      zoom: parseAsInteger,
      selectedId: parseAsString, // 選択された通報ID
    },
    {
      history: 'replace', // 履歴を汚さない
      shallow: true, // SSRを発火させない（地図操作のたびに再取得しない）
    }
  );

  // 通報選択ハンドラー
  const handleSelectReport = (report: ReportDto | null) => {
    setMapState({ selectedId: report?.id ?? null });
  };

  // 地図の状態変更ハンドラー
  const handleMapStateChange = (
    center: { lat: number; lng: number },
    zoom: number
  ) => {
    setMapState({
      lat: Math.round(center.lat * 100000) / 100000, // 小数点5桁まで
      lng: Math.round(center.lng * 100000) / 100000,
      zoom,
    });
  };

  // nuqsでURLパラメータを管理（shallow: trueでクライアントキャッシュ活用）
  const [params, setParams] = useQueryStates(
    {
      view: parseAsStringLiteral(['list', 'map'] as const).withDefault('list'),
      status: parseAsString.withDefault('all'),
      animalType: parseAsString.withDefault('all'),
      staffId: parseAsString.withDefault(defaultStaffId),
      q: parseAsString.withDefault(''),
      page: parseAsInteger.withDefault(1),
      startDate: parseAsString.withDefault(''),
      endDate: parseAsString.withDefault(''),
      sort: parseAsStringLiteral(['asc', 'desc'] as const).withDefault('desc'),
      // UI状態もURLで管理（ブックマーク可能に）
      advancedFilter: parseAsBoolean.withDefault(false),
      timeline: parseAsBoolean.withDefault(false),
      displayDays: parseAsStringLiteral([
        '3',
        '7',
        '14',
        '30',
      ] as const).withDefault('7'),
    },
    {
      history: 'push',
      shallow: true,
    }
  );

  const {
    view: urlViewMode,
    status: statusFilter,
    animalType: animalTypeFilter,
    staffId: staffIdFilter,
    q: searchQuery,
    startDate,
    endDate,
    sort: sortOrder,
    advancedFilter: isAdvancedFilterOpen,
    timeline: isTimelineMode,
    displayDays,
  } = params;

  // pageをparamsから取得
  const urlPage = params.page;

  // 検索パラメータの構築（useQueryのqueryKeyに使用）
  const isMapView = urlViewMode === 'map';
  const searchQueryParams = useMemo(
    (): SearchReportsParams => ({
      query: searchQuery || undefined,
      status: statusFilter || 'all',
      animalType: animalTypeFilter || 'all',
      staffId: staffIdFilter || defaultStaffId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortOrder: sortOrder || 'desc',
      page: isMapView ? 1 : Math.max(1, urlPage),
      limit: isMapView ? MAP_MAX_ITEMS : ITEMS_PER_PAGE,
    }),
    [
      searchQuery,
      statusFilter,
      animalTypeFilter,
      staffIdFilter,
      defaultStaffId,
      startDate,
      endDate,
      sortOrder,
      urlPage,
      isMapView,
    ]
  );

  // 地図遷移時に引き継ぐフィルタのクエリパラメータをatomにセット
  const setMapFilterParams = useSetAtom(mapFilterParamsAtom);
  useEffect(() => {
    const p = new URLSearchParams();
    if (statusFilter === 'all' || !statusFilter) {
      p.set('statusWaiting', 'true');
      p.set('statusCompleted', 'true');
    } else if (statusFilter === 'waiting') {
      p.set('statusWaiting', 'true');
      p.set('statusCompleted', 'false');
    } else if (statusFilter === 'completed') {
      p.set('statusWaiting', 'false');
      p.set('statusCompleted', 'true');
    }
    if (animalTypeFilter && animalTypeFilter !== 'all') {
      const hidden = enabledAnimalTypes
        .map((t) => t.id)
        .filter((id) => id !== animalTypeFilter);
      if (hidden.length > 0) {
        p.set('hiddenAnimals', hidden.join(','));
      }
    }
    if (staffIdFilter && staffIdFilter !== 'all') {
      p.set('displayStaffs', staffIdFilter);
    }
    if (startDate) p.set('startDate', startDate);
    if (endDate) p.set('endDate', endDate);
    setMapFilterParams(p.toString());
  }, [
    statusFilter,
    animalTypeFilter,
    enabledAnimalTypes,
    staffIdFilter,
    startDate,
    endDate,
    setMapFilterParams,
  ]);

  const [initialSearchQueryParams] = useState<SearchReportsParams>(
    () => searchQueryParams
  );

  const shouldUseInitialData = isSameSearchParams(
    searchQueryParams,
    initialSearchQueryParams
  );

  // useQuery + initialData でキャッシュ管理
  const { data: searchResult, isFetching } = useSearchReports(
    searchQueryParams,
    shouldUseInitialData
      ? {
          reports: initialReports,
          totalCount: initialTotalCount,
          totalPages: initialTotalPages,
          currentPage: initialCurrentPage,
        }
      : undefined
  );

  // useQueryの結果を使用（初回はinitialDataから）
  const reports = searchResult?.reports ?? initialReports;
  const totalCount = searchResult?.totalCount ?? initialTotalCount;
  const totalPages = searchResult?.totalPages ?? initialTotalPages;
  const currentPage = searchResult?.currentPage ?? initialCurrentPage;

  // 選択された通報をURLのselectedIdから復元
  const selectedReport = useMemo(() => {
    if (!mapState.selectedId) return null;
    return reports.find((r) => r.id === mapState.selectedId) ?? null;
  }, [mapState.selectedId, reports]);

  // displayDaysを数値型に変換
  const estimatedDisplayDays = Number(displayDays) as EstimatedDisplayDays;

  // 担当者フィルターオプション
  const staffFilterOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'すべての担当者' }];
    staffList.forEach((staff) => {
      options.push({ value: staff.id, label: staff.name });
    });
    return options;
  }, [staffList]);

  // レイヤーフィルタリング（地図表示時のみ）
  const filteredReportsByLayer = useMemo(() => {
    if (urlViewMode !== 'map') return reports;

    return reports.filter((report) => {
      // ステータスフィルター
      const statusMatch = layers.statuses[report.status as ReportStatusValue];
      if (!statusMatch) return false;

      // 獣種フィルター
      const animalMatch =
        layers.animalTypes[report.animalType as AnimalTypeValue];
      if (!animalMatch) return false;

      return true;
    });
  }, [reports, layers, urlViewMode]);

  // 各獣種の件数を計算（ステータスフィルターのみ適用）
  const animalCounts = useMemo(() => {
    const counts = {} as Record<AnimalTypeValue, number>;
    enabledAnimalTypes.forEach((t) => {
      counts[t.id] = 0;
    });

    reports.forEach((report) => {
      const statusEnabled = layers.statuses[report.status as ReportStatusValue];
      if (statusEnabled) {
        const animalType = report.animalType as AnimalTypeValue;
        if (animalType in counts) {
          counts[animalType]++;
        }
      }
    });

    return counts;
  }, [reports, layers.statuses, enabledAnimalTypes]);

  const handleDataPanelToggle = () => {
    setDataPanelOpen(!dataPanelOpen);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
  };

  const handleDataPanelHeightChange = (height: number) => {
    setDataPanelHeight(height);
  };

  // 初回URLに日付がない場合のみ、サーバー適用済み日付を表示用にフォールバック
  const shouldFallbackToAppliedDate =
    !initialSearchQueryParams.startDate &&
    !initialSearchQueryParams.endDate &&
    !startDate &&
    !endDate;

  // 日付範囲のRangeValue変換
  const effectiveStartDate = shouldFallbackToAppliedDate
    ? appliedStartDate
    : startDate;
  const effectiveEndDate = shouldFallbackToAppliedDate
    ? appliedEndDate
    : endDate;

  const dateRangeValue = useMemo((): RangeValue<DateValue> | null => {
    if (!effectiveStartDate && !effectiveEndDate) return null;
    try {
      return {
        start: effectiveStartDate
          ? parseDate(effectiveStartDate)
          : parseDate('2000-01-01'),
        end: effectiveEndDate
          ? parseDate(effectiveEndDate)
          : parseDate('2099-12-31'),
      };
    } catch {
      return null;
    }
  }, [effectiveStartDate, effectiveEndDate]);

  // 日付範囲変更ハンドラー
  const handleDateRangeChange = (value: RangeValue<DateValue> | null) => {
    if (value) {
      setParams({
        startDate: value.start.toString(),
        endDate: value.end.toString(),
        page: 1,
      });
    } else {
      setParams({ startDate: '', endDate: '', page: 1 });
    }
  };

  // 日付フィルタークリア
  const handleClearDateRange = useCallback(() => {
    setParams({ startDate: '', endDate: '', page: 1 });
  }, [setParams]);

  // ページ変更
  const handlePageChange = (newPage: number) => {
    setParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAllFilters = () => {
    setParams({
      status: 'all',
      animalType: 'all',
      staffId: 'all',
      q: '',
      startDate: '',
      endDate: '',
      page: 1,
    });
  };

  // アクティブフィルター一覧を構築
  const activeFilters = useMemo((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];

    if (statusFilter !== 'all') {
      filters.push({
        key: 'status',
        label: `ステータス: ${STATUS_LABELS[statusFilter]}`,
        onRemove: () => setParams({ status: 'all' }),
      });
    }

    if (animalTypeFilter !== 'all') {
      filters.push({
        key: 'animalType',
        label: `獣種: ${getAnimalTypeLabel(animalTypeFilter)}`,
        onRemove: () => setParams({ animalType: 'all' }),
      });
    }

    if (staffIdFilter && staffIdFilter !== 'all') {
      const staffLabel = getStaffLabel(staffIdFilter, staffList);
      if (staffLabel) {
        filters.push({
          key: 'staffId',
          label: `担当者: ${staffLabel}`,
          onRemove: () => setParams({ staffId: 'all' }),
        });
      }
    }

    if (searchQuery) {
      filters.push({
        key: 'query',
        label: `検索: "${searchQuery}"`,
        onRemove: () => setParams({ q: '' }),
      });
    }

    if (effectiveStartDate || effectiveEndDate) {
      filters.push({
        key: 'dateRange',
        label: `期間: ${effectiveStartDate || '...'} ~ ${effectiveEndDate || '...'}`,
        onRemove: handleClearDateRange,
      });
    }

    return filters;
  }, [
    statusFilter,
    animalTypeFilter,
    staffIdFilter,
    staffList,
    searchQuery,
    effectiveStartDate,
    effectiveEndDate,
    setParams,
    handleClearDateRange,
  ]);

  return (
    <div className="space-y-8">
      {/* 新規作成ボタン */}
      <div className="flex justify-end">
        <Link href="/admin/report/new">
          <Button variant="solid-fill" size="md">
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            新規作成
          </Button>
        </Link>
      </div>

      {/* 検索セクション */}
      <div className="space-y-3">
        {/* メインフィルターバー */}
        <FilterBar
          search={{
            value: searchQuery,
            placeholder: '住所や説明で検索',
            onSearch: (value) => setParams({ q: value, page: 1 }),
          }}
          filters={[
            {
              id: 'status-filter',
              ariaLabel: 'ステータスで絞り込み',
              value: statusFilter,
              options: STATUS_OPTIONS,
              onChange: (value) => setParams({ status: value, page: 1 }),
            },
            {
              id: 'animalType-filter',
              ariaLabel: '獣種で絞り込み',
              value: animalTypeFilter,
              options: animalTypeOptions,
              onChange: (value) => setParams({ animalType: value, page: 1 }),
            },
          ]}
          actions={
            <>
              <AdvancedFilterToggleButton
                isOpen={isAdvancedFilterOpen}
                onToggle={() =>
                  setParams({ advancedFilter: !isAdvancedFilterOpen })
                }
              />
              <ViewModeToggle
                value={urlViewMode}
                onChange={(value) => setParams({ view: value })}
                options={VIEW_MODE_OPTIONS}
              />
            </>
          }
          advancedPanel={
            <AdvancedFiltersPanel
              isOpen={isAdvancedFilterOpen}
              extraSection={
                urlViewMode === 'map' ? (
                  <>
                    <ToggleSwitch
                      id="timeline-toggle"
                      label="タイムライン:"
                      checked={isTimelineMode}
                      onChange={(checked) => setParams({ timeline: checked })}
                    />
                    {isTimelineMode && (
                      <>
                        <AdvancedFilterItem
                          label="表示期間:"
                          htmlFor="estimated-days"
                        >
                          <Select
                            id="estimated-days"
                            value={displayDays}
                            onChange={(e) =>
                              setParams({
                                displayDays: e.target.value as
                                  | '3'
                                  | '7'
                                  | '14'
                                  | '30',
                              })
                            }
                            className="w-28"
                          >
                            <option value="3">3日間</option>
                            <option value="7">7日間</option>
                            <option value="14">14日間</option>
                            <option value="30">30日間</option>
                          </Select>
                        </AdvancedFilterItem>
                        <span
                          className={`
                            hidden text-xs text-solid-gray-500
                            sm:inline
                          `}
                        >
                          目撃日から前後
                        </span>
                      </>
                    )}
                  </>
                ) : undefined
              }
            >
              <AdvancedFilterItem label="担当者:" htmlFor="staffId-filter">
                <Select
                  id="staffId-filter"
                  aria-label="担当者で絞り込み"
                  value={staffIdFilter}
                  onChange={(e) =>
                    setParams({ staffId: e.target.value, page: 1 })
                  }
                  className={`
                    w-full
                    sm:w-auto sm:min-w-40
                    lg:w-52
                  `}
                >
                  {staffFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </AdvancedFilterItem>

              {/* 日付範囲 */}
              <AdvancedFilterItem label="期間:" grow>
                <DateRangePicker
                  aria-label="検索期間"
                  value={dateRangeValue}
                  onChange={handleDateRangeChange}
                />
              </AdvancedFilterItem>

              {/* 並び順 */}
              <AdvancedFilterItem label="並び順:" htmlFor="sort-order">
                <Select
                  id="sort-order"
                  value={sortOrder}
                  onChange={(e) =>
                    setParams({
                      sort: e.target.value as 'desc' | 'asc',
                      page: 1,
                    })
                  }
                  className={`
                    w-full
                    sm:w-auto sm:min-w-40
                    lg:w-52
                  `}
                >
                  <option value="desc">通報日時の降順</option>
                  <option value="asc">通報日時の昇順</option>
                </Select>
              </AdvancedFilterItem>
            </AdvancedFiltersPanel>
          }
        />

        {/* アクティブフィルターチップ */}
        <ActiveFilterDisplay
          filters={activeFilters}
          onClearAll={handleClearAllFilters}
        />
      </div>

      {/* 通報一覧（件数表示付き） */}
      <div className="relative">
        {/* ローディングオーバーレイ */}
        {isFetching && (
          <div className="absolute inset-0 z-10 bg-white/70 pt-32">
            <div className="flex flex-col items-center gap-3">
              <div
                className={`
                  size-8 animate-spin rounded-full border-4
                  border-solid-gray-200 border-t-blue-600
                `}
              />
              <p className="text-sm text-solid-gray-600">読み込み中...</p>
            </div>
          </div>
        )}

        {/* リスト/地図/タイムライン表示エリア */}
        <div>
          {urlViewMode === 'map' ? (
            filteredReportsByLayer.length === 0 ? (
              <EmptyState
                message="通報がありません"
                description="検索条件を変更するか、フィルターをクリアしてお試しください"
              />
            ) : (
              <div className="relative h-125 overflow-hidden rounded-lg">
                <MapPage
                  reports={reports}
                  isEmbedded
                  enabledAnimalTypes={enabledAnimalTypes}
                  suggestedQuestions={suggestedQuestions}
                />
              </div>
            )
          ) : (
            <PaginatedReportList
              reports={reports}
              totalCount={totalCount}
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
