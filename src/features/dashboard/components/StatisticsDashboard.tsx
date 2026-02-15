'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card/Card';
import StatusLabel from '@/components/ui/StatusLabel/StatusLabel';
import { isAdminMode } from '@/config/admin-mode';
import {
  getAnimalTypeLabel,
  getAnimalTypeColor,
} from '@/server/domain/constants/animalTypes';
import { useQueryStates, parseAsString } from 'nuqs';
import { useReportStatistics } from '@/hooks/queries/useReportStatistics';
import StatCard from './StatCard';
import AnimalTypePieChart from './AnimalTypePieChart';
import StatusPieChart from './StatusPieChart';
import TrendChart from './TrendChart';
import AreaRanking from './AreaRanking';
import HourlyAnimalChart from './HourlyAnimalChart';
import DashboardDateFilter from './DashboardDateFilter';
import RecentEvents from './RecentEvents';
import type {
  ReportStatisticsDto,
  RecentEventSummaryDto,
} from '@/server/application/dtos/ReportStatisticsDto';
import type { GetReportStatisticsParams } from '@/features/report/actions';

function isSameStatisticsParams(
  a: GetReportStatisticsParams,
  b: GetReportStatisticsParams
): boolean {
  return a.startDate === b.startDate && a.endDate === b.endDate;
}

interface StatisticsDashboardProps {
  /** SSRで取得した統計データ */
  statistics: ReportStatisticsDto;
  /** 直近24時間のイベントデータ */
  recentEvents: RecentEventSummaryDto[];
  /** システム設定で有効な獣種IDリスト */
  enabledAnimalTypeIds: string[];
  /** 統計データ取得に使用した期間の開始日（YYYY-MM-DD） */
  startDate: string;
  /** 統計データ取得に使用した期間の終了日（YYYY-MM-DD） */
  endDate: string;
}

export default function StatisticsDashboard({
  statistics: initialStatistics,
  recentEvents,
  enabledAnimalTypeIds,
  startDate: initialStartDate,
  endDate: initialEndDate,
}: StatisticsDashboardProps) {
  const router = useRouter();
  // nuqsから日付パラメータを読み取り（DashboardDateFilterと共有）
  const [dateParams] = useQueryStates(
    {
      startDate: parseAsString.withDefault(''),
      endDate: parseAsString.withDefault(''),
    },
    { shallow: true }
  );

  // 有効な日付（URLパラメータ > SSR初期値）
  const startDate = dateParams.startDate || initialStartDate;
  const endDate = dateParams.endDate || initialEndDate;

  const statisticsParams: GetReportStatisticsParams = {
    startDate,
    endDate,
  };
  const [initialStatisticsParams] = useState<GetReportStatisticsParams>(
    () => statisticsParams
  );
  const shouldUseInitialData = isSameStatisticsParams(
    statisticsParams,
    initialStatisticsParams
  );

  // useQuery + initialData でキャッシュ管理
  const { data: statistics, isFetching } = useReportStatistics(
    statisticsParams,
    shouldUseInitialData ? initialStatistics : undefined
  );

  const {
    statusCount,
    animalTypeCount,
    timeSeriesAnimalData,
    areaRanking,
    hourlyAnimalData,
  } = statistics ?? initialStatistics;
  const areaRegions = Array.from(
    new Set(
      areaRanking
        .map((item) => item.regionLabel)
        .filter((label) => label.length > 0)
    )
  );
  const areaRegionLabel =
    areaRegions.length === 1
      ? areaRegions[0]
      : areaRegions.length > 1
        ? '複数地域'
        : '';
  const areaRankingTitle = areaRegionLabel
    ? `${areaRegionLabel} 通報の多いエリアランキング（TOP 10）`
    : '通報の多いエリアランキング（TOP 10）';
  const buildAreaReportHref = (query: string) => {
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('startDate', startDate);
    params.set('endDate', endDate);
    return `/admin/report?${params.toString()}`;
  };

  // ステータス別カードのリンクに期間パラメータを付与するヘルパー
  const buildReportHref = (status: string) =>
    `/admin/report?status=${status}&startDate=${startDate}&endDate=${endDate}`;

  // 有効な獣種のみに絞る
  const animalKeys = enabledAnimalTypeIds.filter(
    (k) => k in animalTypeCount
  );

  // Prepare data for animal type bar chart
  const animalTypeChartData = animalKeys.map((key) => ({
    label: getAnimalTypeLabel(key),
    value: animalTypeCount[key],
    color: getAnimalTypeColor(key),
  }));

  return (
    <div
      className={`
        mx-auto w-full max-w-7xl p-4
        sm:p-6
      `}
    >
      {/* Recent Events (24h) */}
      <section
        className={`
          mb-6
          sm:mb-8
        `}
      >
        <RecentEvents data={recentEvents} />
      </section>

      {/* Date Filter */}
      <section
        className={`
          mb-6
          sm:mb-8
        `}
      >
        <div className="flex justify-end">
          <DashboardDateFilter />
        </div>
      </section>

      <div className="relative">
        {/* ローディングオーバーレイ（DatePickerより下のみ） */}
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

        {/* Status Metrics */}
        <section
          className={`
            mb-6
            sm:mb-8
          `}
        >
          <h2
            className={`
              mb-4 flex items-center gap-3 text-xl font-semibold text-blue-900
            `}
          >
            ステータス別
            <span className="text-base font-normal text-gray-500">
              合計: {statusCount.total.toLocaleString()}件
            </span>
          </h2>
          <div
            className={`
              grid grid-cols-2 gap-2
              sm:gap-4
              lg:gap-6
            `}
          >
            <StatCard
              title={<StatusLabel status="waiting" />}
              value={statusCount.waiting}
              subtitle={`全体の${statusCount.total > 0 ? Math.round((statusCount.waiting / statusCount.total) * 100) : 0}%`}
              colorClass="text-status-waiting"
              href={isAdminMode ? buildReportHref('waiting') : undefined}
            />
            <StatCard
              title={<StatusLabel status="completed" />}
              value={statusCount.completed}
              subtitle={`全体の${statusCount.total > 0 ? Math.round((statusCount.completed / statusCount.total) * 100) : 0}%`}
              colorClass="text-status-completed"
              href={isAdminMode ? buildReportHref('completed') : undefined}
            />
          </div>
        </section>

        {/* Pie Charts Row: Animal Type + Status */}
        <section
          className={`
            mb-6 grid grid-cols-1 gap-4
            sm:mb-8 sm:gap-6
            lg:grid-cols-2
          `}
        >
          <Card
            title="獣種別割合"
            padding="lg"
            className={`
              p-4
              sm:p-8
            `}
          >
            <AnimalTypePieChart
              data={animalTypeChartData}
              containerClassName={`
                h-[260px]
                sm:h-[320px]
              `}
            />
          </Card>
          <Card
            title="ステータス別割合"
            padding="lg"
            className={`
              p-4
              sm:p-8
            `}
          >
            <StatusPieChart
              data={statusCount}
              containerClassName={`
                h-[260px]
                sm:h-[320px]
              `}
            />
          </Card>
        </section>

        {/* Line Charts Row: Trend + Hourly */}
        <section
          className={`
            mb-6 grid grid-cols-1 gap-4
            sm:mb-8 sm:gap-6
            lg:grid-cols-2
          `}
        >
          <Card
            title="通報推移"
            padding="lg"
            className={`
              p-4
              sm:p-8
            `}
          >
            <TrendChart
              data={timeSeriesAnimalData}
              containerClassName={`
                h-[320px]
                sm:h-[420px]
              `}
            />
          </Card>
          <Card
            title="時間帯別通報分析"
            padding="lg"
            className={`
              p-4
              sm:p-8
            `}
          >
            <HourlyAnimalChart
              data={hourlyAnimalData}
              containerClassName={`
                h-[320px]
                sm:h-[420px]
              `}
            />
          </Card>
        </section>

        {/* Area Ranking (full width) */}
        <section>
          <Card
            title={areaRankingTitle}
            padding="lg"
            className={`
              p-4
              sm:p-8
            `}
          >
            <AreaRanking
              data={areaRanking}
              onBarClick={
                isAdminMode
                  ? (item) => {
                      router.push(
                        buildAreaReportHref(item.chomeLabel || item.areaKey)
                      );
                    }
                  : undefined
              }
              containerClassName={`
                h-[280px]
                sm:h-[400px]
              `}
            />
          </Card>
        </section>
      </div>
    </div>
  );
}
