'use client';

import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { mapFilterParamsAtom } from '@/features/report/atoms/mapFilterParamsAtom';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faImage,
  faLayerGroup,
  faLocationDot,
} from '@fortawesome/free-solid-svg-icons';
import ClickableStatusBadge from '@/features/report/components/ClickableStatusBadge';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import {
  getAnimalTypeEmoji,
  getAnimalTypeLabel,
} from '@/server/domain/constants/animalTypes';
import type { ReportStatusValue } from '@/server/domain/constants/reportStatuses';
import { formatReportDateTime } from '@/features/common/utils/dateFormatter';

interface ReportListItemProps {
  report: ReportDto;
}

/**
 * 通報リストアイテム
 *
 * サムネイル・説明文・クリッカブルステータスバッジを含むカード表示。
 */
export default function ReportListItem({ report }: ReportListItemProps) {
  const lastImage =
    report.images.length > 0
      ? report.images[report.images.length - 1]
      : null;

  const mapFilterParams = useAtomValue(mapFilterParamsAtom);

  // 通報日時 ±1年 の期間パラメータを生成
  const reportDate = new Date(report.createdAt);
  const startDate = new Date(reportDate);
  startDate.setFullYear(startDate.getFullYear() - 1);
  const endDate = new Date(reportDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const params = new URLSearchParams(mapFilterParams);
  params.set('startDate', formatDate(startDate));
  params.set('endDate', formatDate(endDate));
  const mapHref = `/map?lat=${report.latitude}&lng=${report.longitude}&zoom=18&${params.toString()}`;

  return (
    <li
      className={`
        rounded-lg border border-solid-gray-200 p-5 transition-colors
        hover:bg-solid-gray-50
      `}
    >
      {/* デスクトップ: 5カラムgrid */}
      <div
        className={`
          hidden items-center gap-4
          lg:grid lg:grid-cols-[3fr_2fr_auto_auto_auto]
        `}
      >
        {/* サムネイル + タイトル・日時（リンク部分） */}
        <Link
          href={`/admin/report/${report.id}`}
          className="flex min-w-0 items-center gap-4"
        >
          {/* サムネイル */}
          <div className="size-24 shrink-0 overflow-hidden rounded-lg">
            {lastImage ? (
              <Image
                src={lastImage.url}
                alt={`${getAnimalTypeLabel(report.animalType)}の通報画像`}
                width={96}
                height={96}
                className="size-full object-cover"
                unoptimized
              />
            ) : (
              <div
                className={`
                  flex size-full items-center justify-center bg-solid-gray-50
                `}
              >
                <FontAwesomeIcon
                  icon={faImage}
                  className="text-xl text-solid-gray-300"
                />
              </div>
            )}
          </div>

          {/* タイトル + 日時・担当者 */}
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-blue-900">
              <span className="flex items-center gap-2">
                <span>{getAnimalTypeEmoji(report.animalType)}</span>
                <span className="shrink-0">
                  {getAnimalTypeLabel(report.animalType)}
                </span>
                <span className="font-normal text-solid-gray-600">-</span>
                <span className="font-normal">{report.address}</span>
              </span>
            </h3>
            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <div>
                <span className="font-medium text-solid-gray-900">
                  通報発生日時:
                </span>
                <span className="ml-2 text-solid-gray-700">
                  {formatReportDateTime(report.createdAt, report.hasOnlyDate)}
                </span>
              </div>
              <div>
                <span className="font-medium text-solid-gray-900">
                  担当者:
                </span>
                <span className="ml-2 text-solid-gray-700">
                  {report.staffName || (
                    <span className="text-solid-gray-500">未割り当て</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* 説明文 */}
        <div className="min-w-0">
          {report.description && (
            <p
              className={`
                line-clamp-6 text-xs whitespace-pre-line text-solid-gray-500
              `}
            >
              {report.description}
            </p>
          )}
        </div>

        {/* クラスタリングバッジ */}
        <div className="flex w-10 justify-center">
          {report.eventId && report.eventReportCount != null && (
            <div className="flex flex-col items-center gap-0.5">
              <FontAwesomeIcon
                icon={faLayerGroup}
                className="size-3 text-blue-800"
              />
              <span className="text-xs font-medium text-blue-800">
                {report.eventReportCount}件
              </span>
            </div>
          )}
        </div>

        {/* 地図で見るボタン */}
        <Link
          href={mapHref}
          className={`
            inline-flex items-center gap-1 rounded-lg border
            border-solid-gray-300 px-3 py-2 text-sm text-solid-gray-700
            transition-colors
            hover:bg-solid-gray-50
          `}
        >
          <FontAwesomeIcon icon={faLocationDot} className="text-xs" />
          地図で見る
        </Link>

        {/* ステータスバッジ */}
        <ClickableStatusBadge
          reportId={report.id}
          status={report.status as ReportStatusValue}
        />
      </div>

      {/* モバイル: 縦積みレイアウト */}
      <div
        className={`
          grid gap-3
          lg:hidden
        `}
      >
        {/* 上部: サムネイル + タイトル情報 */}
        <Link
          href={`/admin/report/${report.id}`}
          className="flex items-center gap-3"
        >
          <div className="size-16 shrink-0 overflow-hidden rounded-lg">
            {lastImage ? (
              <Image
                src={lastImage.url}
                alt={`${getAnimalTypeLabel(report.animalType)}の通報画像`}
                width={64}
                height={64}
                className="size-full object-cover"
                unoptimized
              />
            ) : (
              <div
                className={`
                  flex size-full items-center justify-center bg-solid-gray-50
                `}
              >
                <FontAwesomeIcon
                  icon={faImage}
                  className="text-xl text-solid-gray-300"
                />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-blue-900">
              <span className="flex items-center gap-1">
                <span>{getAnimalTypeEmoji(report.animalType)}</span>
                <span className="shrink-0">
                  {getAnimalTypeLabel(report.animalType)}
                </span>
              </span>
              <span className="block truncate text-sm font-normal">
                {report.address}
              </span>
            </h3>
            <div className="mt-1 text-xs text-solid-gray-700">
              <div>{formatReportDateTime(report.createdAt, report.hasOnlyDate)}</div>
              <div>
                担当者:{' '}
                {report.staffName || (
                  <span className="text-solid-gray-500">未割り当て</span>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* 中部: 説明文 */}
        {report.description && (
          <p
            className={`
              line-clamp-6 text-xs whitespace-pre-line text-solid-gray-500
            `}
          >
            {report.description}
          </p>
        )}

        {/* 下部: アクションボタン */}
        <div className="flex items-center gap-2">
          {report.eventId && report.eventReportCount != null && (
            <div className="flex items-center gap-1">
              <FontAwesomeIcon
                icon={faLayerGroup}
                className="size-3 text-blue-800"
              />
              <span className="text-xs font-medium text-blue-800">
                {report.eventReportCount}件
              </span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href={mapHref}
              className={`
                text-oln-16N-100 inline-flex items-center gap-1 rounded-lg
                border border-solid-gray-300 p-2 text-solid-gray-700
                transition-colors
                hover:bg-solid-gray-50
              `}
            >
              <FontAwesomeIcon icon={faLocationDot} className="text-xs" />
              地図で見る
            </Link>
            <ClickableStatusBadge
              reportId={report.id}
              status={report.status as ReportStatusValue}
            />
          </div>
        </div>
      </div>
    </li>
  );
}
