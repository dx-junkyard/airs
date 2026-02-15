import { faEnvelope, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import { formatDateTime } from '@/features/common/utils/dateFormatter';

interface StaffListItemProps {
  staff: StaffDto;
}

/**
 * 職員リストアイテム（Server Component）
 *
 * 各職員カードの表示を担当。通報カードと同じスタイルを使用。
 * メールアドレス（任意）と担当通報件数を表示。
 */
export default function StaffListItem({ staff }: StaffListItemProps) {
  return (
    <li
      className={`
        rounded-lg border border-solid-gray-200 p-5 transition-colors
        hover:bg-solid-gray-50
      `}
    >
      <Link href={`/admin/staff/${staff.id}`}>
        <div className="space-y-3">
          {/* ヘッダー部分 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faUserTie}
                    className="size-4 text-blue-800"
                    aria-hidden="true"
                  />
                  <span>{staff.name}</span>
                </span>
              </h3>
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {staff.email && (
              <div className="flex items-center gap-1">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="size-3.5 text-solid-gray-600"
                  aria-hidden="true"
                />
                <span className="text-solid-gray-700">{staff.email}</span>
              </div>
            )}
            {staff.reportCounts && (
              <div className="flex items-center gap-3">
                <span className={`
                  inline-flex items-center gap-1 rounded bg-yellow-50 px-2
                  py-0.5 text-xs font-medium text-yellow-800
                `}>
                  確認待ち {staff.reportCounts.waiting}件
                </span>
              </div>
            )}
            <div>
              <span className="font-medium text-solid-gray-900">
                登録日時:
              </span>
              <span className="ml-2 text-solid-gray-700">
                {formatDateTime(staff.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
