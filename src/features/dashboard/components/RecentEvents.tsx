import Link from 'next/link';

import { Card } from '@/components/ui/Card/Card';
import { isAdminMode } from '@/config/admin-mode';
import type { RecentEventSummaryDto } from '@/server/application/dtos/ReportStatisticsDto';
import {
  getAnimalTypeLabel,
  getAnimalTypeColor,
} from '@/server/domain/constants/animalTypes';

interface RecentEventsProps {
  data: RecentEventSummaryDto[];
}

function buildAdminReportUrl(ev: RecentEventSummaryDto): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const params = new URLSearchParams();
  params.set('animalType', ev.animalType);
  if (ev.staffId) {
    params.set('staffId', ev.staffId);
  }
  params.set('startDate', yesterday.toISOString().split('T')[0]);
  params.set('endDate', today.toISOString().split('T')[0]);

  return `/admin/report?${params.toString()}`;
}

export default function RecentEvents({ data }: RecentEventsProps) {
  if (data.length === 0) {
    return (
      <Card title="直近24時間の通報グループ" padding="lg">
        <p className="text-sm text-solid-gray-420">
          直近24時間に新しい通報グループはありません
        </p>
        {isAdminMode && (
          <Link
            href="/admin/report"
            className={`
              mt-2 inline-block text-sm text-blue-600
              hover:underline
            `}
          >
            通報一覧を確認する &rarr;
          </Link>
        )}
      </Card>
    );
  }

  const totalReports = data.reduce((sum, ev) => sum + ev.reportCount, 0);

  return (
    <Card title="直近24時間の通報グループ" padding="lg">
      <p className="mb-4 text-sm text-solid-gray-600">
        {data.length}件の通報グループ（通報 計{totalReports}件）
      </p>
      <div className="space-y-3">
        {data.map((ev) => {
          const content = (
            <div
              className={`
                flex items-center justify-between rounded-md border
                border-solid-gray-200 bg-solid-gray-50 px-4 py-3
                ${isAdminMode ? `
                  transition-colors
                  hover:bg-solid-gray-100
                ` : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`
                    inline-flex items-center rounded-full px-2.5 py-0.5 text-xs
                    font-medium text-white
                  `}
                  style={{
                    backgroundColor: getAnimalTypeColor(ev.animalType),
                  }}
                >
                  {getAnimalTypeLabel(ev.animalType)}
                </span>
                <span className="text-sm text-blue-900">
                  {ev.areaKey || ev.address}
                </span>
                {isAdminMode && (
                  <span className="text-xs text-solid-gray-500">
                    {ev.staffName ?? '未割当'}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-blue-900">
                {ev.reportCount}件
              </span>
            </div>
          );

          if (isAdminMode) {
            return (
              <Link
                key={ev.eventId}
                href={buildAdminReportUrl(ev)}
                className="block no-underline"
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={ev.eventId}>
              {content}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
