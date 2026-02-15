'use client';

import React, { useMemo } from 'react';

interface DataTableProps {
  data: Record<string, unknown>[];
  maxRows?: number;
}

/**
 * ステータス値を日本語ラベルに変換
 */
const statusLabels: Record<string, string> = {
  waiting: '確認待ち',
  completed: '確認完了',
};

/**
 * 動物種別を日本語ラベルに変換
 */
const animalTypeLabels: Record<string, string> = {
  monkey: 'サル',
  deer: 'シカ',
  wild_boar: 'イノシシ',
  bear: 'クマ',
  other: 'その他',
};

/**
 * 値をフォーマットして表示用文字列に変換
 */
function formatValue(value: unknown, column?: string): string {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'はい' : 'いいえ';
  }
  if (typeof value === 'number') {
    return value.toLocaleString('ja-JP');
  }
  if (typeof value === 'string') {
    // ステータス値の日本語変換
    if (column === 'status' && value in statusLabels) {
      return statusLabels[value];
    }
    // 動物種別の日本語変換
    if (column === 'animalType' && value in animalTypeLabels) {
      return animalTypeLabels[value];
    }
    // ISO日付文字列をチェック（タイムゾーン明示でSSR/CSR不一致を防止）
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      const date = new Date(value);
      return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Tokyo',
      }).format(date);
    }
    // 長い文字列は切り詰め
    if (value.length > 50) {
      return value.substring(0, 47) + '...';
    }
    return value;
  }
  if (Array.isArray(value)) {
    return `[${value.length}件]`;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * カラム名を日本語に変換
 */
function formatColumnName(column: string): string {
  const columnMap: Record<string, string> = {
    id: 'ID',
    animalType: '動物種別',
    animal_type: '動物種別',
    latitude: '緯度',
    longitude: '経度',
    address: '住所',
    phoneNumber: '電話番号',
    phone_number: '電話番号',
    images: '画像',
    description: '説明',
    status: 'ステータス',
    createdAt: '作成日時',
    created_at: '作成日時',
    updatedAt: '更新日時',
    updated_at: '更新日時',
    deletedAt: '削除日時',
    deleted_at: '削除日時',
    count: '件数',
    total: '合計',
  };
  return columnMap[column] || column;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  maxRows = 100,
}) => {
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const displayData = useMemo(() => {
    return data.slice(0, maxRows);
  }, [data, maxRows]);

  if (data.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-solid-gray-500">
        データがありません
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-solid-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className={`
            bg-solid-gray-50 text-xs text-solid-gray-700 uppercase
          `}>
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 whitespace-nowrap">
                  {formatColumnName(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-solid-gray-200">
            {displayData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`
                  bg-white
                  hover:bg-solid-gray-50
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column}
                    className="px-4 py-3 whitespace-nowrap text-solid-gray-900"
                  >
                    {formatValue(row[column], column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > maxRows && (
        <div
          className={`
            border-t border-solid-gray-200 bg-solid-gray-50 px-4 py-2 text-xs
            text-solid-gray-500
          `}
        >
          {data.length}件中{maxRows}件を表示しています
        </div>
      )}
    </div>
  );
};

export default DataTable;
