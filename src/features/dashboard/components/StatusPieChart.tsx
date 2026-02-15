'use client';

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { StatusCountDto } from '@/server/application/dtos/ReportStatisticsDto';

interface StatusPieChartProps {
  data: StatusCountDto;
  /** 外側コンテナの追加className（レスポンシブ高さ等） */
  containerClassName?: string;
}

const STATUS_CONFIG = [
  { key: 'waiting' as const, label: '確認待ち', color: '#ec0000' },
  { key: 'completed' as const, label: '確認完了', color: '#3460fb' },
];

interface ChartEntry {
  [key: string]: unknown;
  label: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartEntry }>;
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
        <p className="mb-1 text-sm text-solid-gray-600">{data.label}</p>
        <p className="text-base font-semibold" style={{ color: data.color }}>
          {payload[0].value}件
        </p>
      </div>
    );
  }
  return null;
}

import type { PieLabelRenderProps } from 'recharts';

const RADIAN = Math.PI / 180;

function renderCustomLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props as {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  };
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function StatusPieChart({
  data,
  containerClassName,
}: StatusPieChartProps) {
  const chartData: ChartEntry[] = STATUS_CONFIG.map((s) => ({
    label: s.label,
    value: data[s.key],
    color: s.color,
  })).filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div
        className={`
          flex items-center justify-center text-solid-gray-400
          ${containerClassName ?? ''}
        `}
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
    >
      <div className="h-full min-h-[1px] min-w-[1px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="45%"
              outerRadius="70%"
              label={renderCustomLabel}
              labelLine={false}
              strokeWidth={2}
              stroke="#fff"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ fontSize: '11px' }}
              formatter={(value: string) => (
                <span className="text-solid-gray-700">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
