'use client';

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface BarChartData {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  /** 外側コンテナの追加className（レスポンシブ高さ等） */
  containerClassName?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: BarChartData }>;
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

// X軸ラベルの最大文字数（モバイル向け省略表示）
const MAX_TICK_LABEL_LENGTH = 6;

function truncateTickLabel(label: string): string {
  if (label.length <= MAX_TICK_LABEL_LENGTH) return label;
  return label.slice(0, MAX_TICK_LABEL_LENGTH) + '..';
}

export default function BarChart({
  data,
  height = 300,
  containerClassName,
}: BarChartProps) {
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
          <RechartsBarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickMargin={6}
              interval={0}
              tickFormatter={truncateTickLabel}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              allowDecimals={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
