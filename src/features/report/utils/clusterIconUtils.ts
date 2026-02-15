import L from 'leaflet';
import type { ReportDto } from '@/server/application/dtos/ReportDto';

type ClusterSize = 'small' | 'medium' | 'large';

/**
 * クラスターのサイズを決定
 */
const getClusterSize = (count: number): ClusterSize => {
  if (count < 10) return 'small';
  if (count < 50) return 'medium';
  return 'large';
};

/**
 * クラスターアイコンを生成するメイン関数
 * Tailwind CSSクラスでスタイリング
 */
export const createClusterIcon = (cluster: L.MarkerCluster): L.DivIcon => {
  const markers = cluster.getAllChildMarkers() as Array<
    L.Marker & { options: { report?: ReportDto } }
  >;
  const childCount = cluster.getChildCount();
  const size = getClusterSize(childCount);

  // サイズ別のTailwindクラス
  const sizeClasses = {
    small: 'w-9 h-9', // 36px
    medium: 'w-[46px] h-[46px]',
    large: 'w-14 h-14', // 56px
  };

  const fontSizeClasses = {
    small: 'text-sm', // 14px
    medium: 'text-lg', // 18px
    large: 'text-[22px]',
  };

  const sizeMap = {
    small: 36,
    medium: 46,
    large: 56,
  };

  const pixelSize = sizeMap[size];

  return L.divIcon({
    html: `
      <div class="flex items-center justify-center rounded-full bg-gray-600 border-[3px] border-white shadow-md ${sizeClasses[size]} cursor-pointer">
        <span class="text-white font-bold ${fontSizeClasses[size]}">${childCount}</span>
      </div>
    `,
    className: '',
    iconSize: L.point(pixelSize, pixelSize),
  });
};
