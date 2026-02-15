'use client';

import dynamic from 'next/dynamic';
import type { FacilityDto } from '@/server/application/dtos/FacilityDto';

// Leafletを使う地図はSSR無効化で読み込み
const FacilityMap = dynamic(
  () => import('@/features/facility/components/FacilityMap'),
  {
    ssr: false,
    loading: () => (
      <div
        className={`
          flex h-[400px] items-center justify-center rounded-lg bg-solid-gray-50
        `}
      >
        <div className="text-solid-gray-600">地図を読み込み中...</div>
      </div>
    ),
  }
);

interface FacilityManagementClientProps {
  /** 選択中の職員ID */
  staffId: string | null;
  /** 選択中の職員名 */
  staffName: string | null;
  /** SSRで取得した施設データ */
  facilities: FacilityDto[];
  /** デフォルト中心座標 */
  defaultCenter: { lat: number; lng: number };
}

/**
 * 周辺施設管理ページのクライアントコンポーネント
 */
const FacilityManagementClient = ({
  staffId,
  staffName,
  facilities,
  defaultCenter,
}: FacilityManagementClientProps) => {
  if (!staffId) {
    return (
      <div className="space-y-4">
        <div
          className={`
            rounded-lg border border-solid-gray-200 bg-solid-gray-50 p-8
            text-center
          `}
        >
          <p className="text-lg font-medium text-solid-gray-700">
            職員が選択されていません
          </p>
          <p className="mt-2 text-sm text-solid-gray-500">
            職員管理から担当職員を選択してください。
            <br />
            選択した職員に紐づく周辺施設を管理できます。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-solid-gray-200 bg-white p-4">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-solid-gray-500">担当職員:</span>
          <span className="font-medium">{staffName}</span>
        </div>
        <FacilityMap
          staffId={staffId}
          initialFacilities={facilities}
          defaultCenter={defaultCenter}
        />
      </div>
    </div>
  );
};

export default FacilityManagementClient;
