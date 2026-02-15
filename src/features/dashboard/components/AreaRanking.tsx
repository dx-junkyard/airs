'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AreaCountDto } from '@/server/application/dtos/ReportStatisticsDto';

interface AreaRankingProps {
  data: AreaCountDto[];
  height?: number;
  /** 外側コンテナの追加className（レスポンシブ高さ等） */
  containerClassName?: string;
  /** 横棒クリック時の処理（管理者画面連携用） */
  onBarClick?: (item: AreaCountDto) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: { areaKey: string; chomeLabel: string; count: number };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className={`
          rounded-lg border border-solid-gray-200 bg-white p-3 shadow-md
        `}
      >
        <p className="mb-1 text-sm text-solid-gray-600">
          {data.chomeLabel || data.areaKey}
        </p>
        <p className="text-base font-semibold text-blue-600">
          {data.count}件
        </p>
      </div>
    );
  }
  return null;
}

// グラデーションカラー（1位から10位まで）
const COLORS = [
  '#dc2626', // 1位 - 赤
  '#ea580c', // 2位
  '#f59e0b', // 3位
  '#84cc16', // 4位
  '#22c55e', // 5位
  '#14b8a6', // 6位
  '#06b6d4', // 7位
  '#3b82f6', // 8位
  '#6366f1', // 9位
  '#8b5cf6', // 10位
];

// Y軸ラベルの最大文字数（モバイル向けに短縮）
const MAX_LABEL_LENGTH = 8;

function truncateLabel(label: string): string {
  if (label.length <= MAX_LABEL_LENGTH) return label;
  return label.slice(0, MAX_LABEL_LENGTH) + '...';
}

export default function AreaRanking({
  data,
  height = 400,
  containerClassName,
  onBarClick,
}: AreaRankingProps) {
  const displayData = data.map((item) => ({
    ...item,
    chomeLabel: item.chomeLabel || item.areaKey,
  }));

  if (data.length === 0) {
    return (
      <div
        className={`
          flex items-center justify-center text-solid-gray-400
          ${containerClassName ?? ''}
        `}
        style={containerClassName ? undefined : { height: `${height}px` }}
      >
        データがありません
      </div>
    );
  }

  return (
    <div
      className={`
        size-full
        ${containerClassName ?? ''}
      `}
      style={containerClassName ? undefined : { height: `${height}px` }}
    >
      <div className="h-full min-h-[1px] min-w-[1px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="chomeLabel"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              width={96}
              tickFormatter={truncateLabel}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              maxBarSize={30}
              onClick={(_, index) => {
                if (!onBarClick) return;
                if (index == null || displayData[index] == null) return;
                onBarClick(displayData[index]);
              }}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  cursor={onBarClick ? 'pointer' : 'default'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
