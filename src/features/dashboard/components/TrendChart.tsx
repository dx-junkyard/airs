'use client';

import { useMemo, useState } from 'react';
import type { TimeSeriesAnimalDataDto } from '@/server/application/dtos/ReportStatisticsDto';
import {
  getAnimalTypeColor,
  getAnimalTypeLabel,
  VALID_ANIMAL_TYPES,
} from '@/server/domain/constants/animalTypes';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface TrendChartProps {
  data: TimeSeriesAnimalDataDto[];
  height?: number;
  /** 外側コンテナの追加className（レスポンシブ高さ等） */
  containerClassName?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    // 値でソート（降順）
    const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
    // 合計を計算
    const total = sortedPayload.reduce((sum, entry) => sum + entry.value, 0);

    return (
      <div
        className={`
          rounded-lg border border-solid-gray-200 bg-white p-3 shadow-md
        `}
      >
        <p className="mb-2 text-sm font-semibold text-solid-gray-800">{label ? formatDateLabel(label) : label}</p>
        {sortedPayload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block size-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-solid-gray-600">
              {getAnimalTypeLabel(entry.dataKey)}:
            </span>
            <span className="font-medium" style={{ color: entry.color }}>
              {entry.value}件
            </span>
          </div>
        ))}
        <div className={`
          mt-2 border-t border-solid-gray-200 pt-2 text-sm font-semibold
          text-solid-gray-700
        `}>
          合計: {total}件
        </div>
      </div>
    );
  }
  return null;
}

/**
 * YYYY-MM-DD形式の日付文字列をM/D形式に変換する
 * 例: "2024-01-15" → "1/15", "2024-12-03" → "12/3"
 */
function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(month) || isNaN(day)) return dateStr;
  return `${month}/${day}`;
}

export default function TrendChart({
  data,
  height = 300,
  containerClassName,
}: TrendChartProps) {
  // データから動的な獣種キーを抽出（ドメイン定義順でソート）
  const animalKeys = useMemo(() => {
    const keySet = new Set<string>();
    data.forEach((d) => {
      Object.keys(d).forEach((k) => {
        if (k !== 'date') keySet.add(k);
      });
    });
    const keys = Array.from(keySet);
    // VALID_ANIMAL_TYPES の定義順に従ってソート
    keys.sort((a, b) => {
      const indexA = VALID_ANIMAL_TYPES.indexOf(a as (typeof VALID_ANIMAL_TYPES)[number]);
      const indexB = VALID_ANIMAL_TYPES.indexOf(b as (typeof VALID_ANIMAL_TYPES)[number]);
      // 定義に存在しないキーは末尾に配置
      return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
    });
    return keys;
  }, [data]);

  // 表示/非表示の状態管理
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({});

  // 各獣種の合計件数を計算
  const totals = useMemo(() => {
    const result: Record<string, number> = {};
    animalKeys.forEach((key) => {
      result[key] = 0;
    });
    data.forEach((d) => {
      animalKeys.forEach((key) => {
        result[key] += (d[key] as number) ?? 0;
      });
    });
    return result;
  }, [data, animalKeys]);

  // 全日付のデータが0の場合
  const hasData = Object.values(totals).some((v) => v > 0);

  if (!hasData || data.length === 0) {
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

  // ラインの表示判定（デフォルトは表示）
  const isLineVisible = (key: string) => visibleLines[key] ?? true;

  // 凡例クリックハンドラ
  const handleLegendClick = (dataKey: string) => {
    setVisibleLines((prev) => ({
      ...prev,
      [dataKey]: !(prev[dataKey] ?? true),
    }));
  };

  // カスタム凡例レンダラー
  const renderLegend = () => {
    return (
      <div className="mt-2 flex flex-wrap justify-center gap-4">
        {animalKeys.map((key) => {
          // データがない獣種は表示しない
          if (totals[key] === 0) return null;

          const isVisible = isLineVisible(key);
          const color = getAnimalTypeColor(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleLegendClick(key)}
              className={`
                flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1
                text-xs transition-all
                hover:bg-solid-gray-50
                ${isVisible ? 'opacity-100' : 'opacity-40'}
              `}
            >
              <span
                className="inline-block size-3 rounded-full"
                style={{
                  backgroundColor: color,
                  opacity: isVisible ? 1 : 0.4,
                }}
              />
              <span
                className={`
                  ${isVisible ? 'text-solid-gray-700' : `
                    text-solid-gray-400 line-through
                  `}
                `}
              >
                {getAnimalTypeLabel(key)}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`
        size-full
        ${containerClassName ?? ''}
      `}
      style={containerClassName ? undefined : { height: `${height}px` }}
    >
      <div className="h-full min-h-[1px] min-w-[1px]">
        <ResponsiveContainer width="100%" height="85%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickMargin={6}
              angle={-35}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              allowDecimals={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 10 }} />
            <Legend content={renderLegend} />
            {animalKeys.map((key) => {
              const color = getAnimalTypeColor(key);
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: color, strokeWidth: 0 }}
                  activeDot={{
                    r: 5,
                    fill: color,
                    strokeWidth: 2,
                    stroke: '#fff',
                  }}
                  hide={!isLineVisible(key) || totals[key] === 0}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
