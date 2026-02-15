'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie,
  faChartLine,
  faRankingStar,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import {
  ANIMAL_TYPES,
  getAnimalTypeLabel,
  getAnimalTypeColor,
  type AnimalTypeValue,
} from '@/server/domain/constants/animalTypes';

/** エリアランキングの1アイテム */
interface AreaRankingItem {
  /** エリアキー（グルーピング用） */
  areaKey: string;
  /** 地域ラベル（都道府県+市区町村） */
  regionLabel: string;
  /** 丁目ラベル（大字+字） */
  chomeLabel: string;
  /** 件数 */
  count: number;
  /** エリア内の全通報の緯度の平均 */
  centerLat: number;
  /** エリア内の全通報の経度の平均 */
  centerLng: number;
}

interface MapStatisticsPanelProps {
  /** フィルタ済み通報データ */
  filteredReports: ReportDto[];
  /** エリアクリック時のコールバック（地図のflyTo用） */
  onAreaClick?: (lat: number, lng: number) => void;
}

// グラデーションカラー（エリアランキング用）
const RANKING_COLORS = [
  '#dc2626', // 1位
  '#ea580c',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6', // 10位
];

/**
 * 地図レイヤーパネル内のコンパクト統計ダッシュボード
 *
 * filteredReportsからクライアントサイドで統計情報を計算し表示する。
 * - 獣種別件数のドーナツチャート
 * - 月別推移の折れ線グラフ
 * - エリアランキング（クリックで地図移動）
 */
const MapStatisticsPanel = ({
  filteredReports,
  onAreaClick,
}: MapStatisticsPanelProps) => {
  // --- 獣種別件数 ---
  const animalTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReports.forEach((report) => {
      counts[report.animalType] = (counts[report.animalType] ?? 0) + 1;
    });
    // 件数の多い順にソート
    return Object.entries(counts)
      .map(([type, count]) => ({
        name: getAnimalTypeLabel(type),
        value: count,
        color: getAnimalTypeColor(type),
        emoji: ANIMAL_TYPES[type as AnimalTypeValue]?.emoji ?? '',
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredReports]);

  // --- 月別推移 ---
  const monthlyTrend = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReports.forEach((report) => {
      const date = new Date(report.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      counts[key] = (counts[key] ?? 0) + 1;
    });
    // 日付順にソート
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => {
        // "YYYY-MM" -> "M月"
        const parts = month.split('-');
        const label = `${parseInt(parts[1], 10)}月`;
        return { month, label, count };
      });
  }, [filteredReports]);

  // --- エリアランキング ---
  const areaRanking = useMemo(() => {
    const groups: Record<
      string,
      { regionLabel: string; chomeLabel: string; count: number; latSum: number; lngSum: number }
    > = {};
    filteredReports.forEach((report) => {
      const key = report.areaKey;
      if (!key) return; // normalizedAddressがない通報はスキップ
      if (!groups[key]) {
        groups[key] = {
          regionLabel: report.areaRegionLabel ?? '',
          chomeLabel: report.areaChomeLabel ?? '',
          count: 0,
          latSum: 0,
          lngSum: 0,
        };
      }
      groups[key].count++;
      groups[key].latSum += report.latitude;
      groups[key].lngSum += report.longitude;
    });
    // 件数の多い順にソート、TOP10
    const ranking: AreaRankingItem[] = Object.entries(groups)
      .map(([areaKey, { regionLabel, chomeLabel, count, latSum, lngSum }]) => ({
        areaKey,
        regionLabel,
        chomeLabel,
        count,
        centerLat: latSum / count,
        centerLng: lngSum / count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    return ranking;
  }, [filteredReports]);

  const totalCount = filteredReports.length;

  if (totalCount === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-solid-gray-400">
          表示中のデータがありません
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* 総件数 */}
      <div className="mb-4 text-center">
        <p className="text-xs text-solid-gray-500">表示中の通報</p>
        <p className="text-2xl font-bold text-blue-700">
          {totalCount.toLocaleString()}
          <span className="ml-1 text-sm font-normal text-solid-gray-500">
            件
          </span>
        </p>
      </div>

      {/* 獣種別ドーナツチャート */}
      <section className="mb-5">
        <h3
          className={`
            mb-2 flex items-center gap-1.5 text-xs font-semibold
            text-solid-gray-700
          `}
        >
          <FontAwesomeIcon
            icon={faChartPie}
            className="size-3 text-blue-500"
          />
          獣種別件数
        </h3>
        <div className="flex items-center">
          <div className="size-[140px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={animalTypeCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {animalTypeCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as (typeof animalTypeCounts)[number];
                      const pct = ((data.value / totalCount) * 100).toFixed(1);
                      return (
                        <div
                          className={`
                            rounded-lg border border-solid-gray-200 bg-white p-2
                            shadow-md
                          `}
                        >
                          <p className="text-xs text-solid-gray-600">
                            {data.name}
                          </p>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: data.color }}
                          >
                            {data.value}件 ({pct}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* 凡例（上位5件） */}
          <div className="ml-2 min-w-0 flex-1 space-y-1">
            {animalTypeCounts.slice(0, 5).map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-1.5 text-xs"
              >
                <span
                  className="inline-block size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="min-w-0 truncate text-solid-gray-600">
                  {item.name}
                </span>
                <span className={`
                  ml-auto shrink-0 font-medium text-solid-gray-800
                `}>
                  {item.value}
                </span>
              </div>
            ))}
            {animalTypeCounts.length > 5 && (
              <p className="text-xs text-solid-gray-400">
                +{animalTypeCounts.length - 5} 種
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 月別推移 */}
      {monthlyTrend.length > 1 && (
        <section className="mb-5">
          <h3
            className={`
              mb-2 flex items-center gap-1.5 text-xs font-semibold
              text-solid-gray-700
            `}
          >
            <FontAwesomeIcon
              icon={faChartLine}
              className="size-3 text-blue-500"
            />
            月別推移
          </h3>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyTrend}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={28}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div
                          className={`
                            rounded-lg border border-solid-gray-200 bg-white p-2
                            shadow-md
                          `}
                        >
                          <p className="text-xs text-solid-gray-600">
                            {(payload[0].payload as (typeof monthlyTrend)[number]).month}
                          </p>
                          <p className="text-sm font-semibold text-blue-600">
                            {payload[0].value}件
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* エリアランキング */}
      {areaRanking.length > 0 && (
        <section>
          <h3
            className={`
              mb-2 flex items-center gap-1.5 text-xs font-semibold
              text-solid-gray-700
            `}
          >
            <FontAwesomeIcon
              icon={faRankingStar}
              className="size-3 text-blue-500"
            />
            通報の多いエリア
          </h3>
          <div className="space-y-1">
            {areaRanking.map((item, index) => (
              <button
                key={item.areaKey}
                type="button"
                onClick={() =>
                  onAreaClick?.(item.centerLat, item.centerLng)
                }
                className={`
                  group flex w-full items-center gap-2 rounded-md px-2 py-1.5
                  text-left transition-colors
                  hover:bg-blue-50
                `}
              >
                {/* 順位 */}
                <span
                  className={`
                    flex size-5 shrink-0 items-center justify-center
                    rounded-full text-xs font-bold text-white
                  `}
                  style={{
                    backgroundColor:
                      RANKING_COLORS[index % RANKING_COLORS.length],
                  }}
                >
                  {index + 1}
                </span>
                {/* エリア名 */}
                <span
                  className={`
                    min-w-0 flex-1 truncate text-xs text-solid-gray-700
                    group-hover:text-blue-700
                  `}
                >
                  {item.chomeLabel || item.areaKey}
                </span>
                {/* 件数 */}
                <span className={`
                  shrink-0 text-xs font-medium text-solid-gray-800
                `}>
                  {item.count}件
                </span>
                {/* 移動アイコン */}
                <FontAwesomeIcon
                  icon={faLocationDot}
                  className={`
                    size-3 shrink-0 text-solid-gray-300
                    group-hover:text-blue-500
                  `}
                />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MapStatisticsPanel;
