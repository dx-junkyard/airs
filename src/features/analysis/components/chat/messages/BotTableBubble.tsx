'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTable,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import BotAvatar from '@/features/analysis/components/chat/shared/BotAvatar';
import DataTable from '@/features/analysis/components/results/DataTable';
import type { SqlQueryResult } from '@/features/analysis/types/analysis';

interface BotTableBubbleProps {
  result: SqlQueryResult;
}

export const BotTableBubble: React.FC<BotTableBubbleProps> = ({ result }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!result.success || !result.data) {
    return (
      <div className="flex items-start gap-3">
        <BotAvatar />
        <div
          className={`
            max-w-[90%] rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700
          `}
        >
          クエリ実行エラー: {result.error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <BotAvatar />
      <div className="max-w-[90%] space-y-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            flex w-full items-center justify-between rounded-lg bg-solid-gray-50
            px-4 py-3 text-left transition-colors
            hover:bg-solid-gray-100
          `}
        >
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faTable}
              className="size-4 text-solid-gray-500"
            />
            <span className="text-sm font-medium text-solid-gray-700">
              クエリ結果 ({result.rowCount}件)
            </span>
          </div>
          <FontAwesomeIcon
            icon={isExpanded ? faChevronUp : faChevronDown}
            className="size-4 text-solid-gray-400"
          />
        </button>

        {isExpanded && result.data.length > 0 && (
          <div className="mt-2">
            <DataTable data={result.data} maxRows={20} />
          </div>
        )}

        {isExpanded && result.data.length === 0 && (
          <div
            className={`
              rounded-lg bg-solid-gray-50 px-4 py-3 text-sm text-solid-gray-500
            `}
          >
            該当するデータがありませんでした
          </div>
        )}
      </div>
    </div>
  );
};

export default BotTableBubble;
