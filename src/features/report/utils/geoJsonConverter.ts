import type { ReportDto } from '@/server/application/dtos/ReportDto';
import type {
  TimelineGeoJSON,
  TimelineFeature,
  TimelineRange,
  EstimatedDisplayDays,
} from '@/features/report/types/timeline';

/**
 * ReportDtoをタイムラインGeoJSONフィーチャーに変換
 *
 * @param report - 通報データ
 * @param estimatedDisplayDays - 推定表示日数（通報日からN日間表示を継続）
 * @returns タイムラインGeoJSONフィーチャー
 */
function convertReportToFeature(
  report: ReportDto,
  estimatedDisplayDays: EstimatedDisplayDays
): TimelineFeature {
  const reportDate = new Date(report.createdAt);

  // 開始時刻: 通報日当日
  const startDate = new Date(reportDate);
  startDate.setHours(0, 0, 0, 0);

  // 終了時刻: 通報日から estimatedDisplayDays 日後（通報日以降N日間マーカーを表示）
  const endDate = new Date(reportDate);
  endDate.setDate(endDate.getDate() + estimatedDisplayDays);
  endDate.setHours(23, 59, 59, 999);

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [report.longitude, report.latitude],
    },
    properties: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      id: report.id,
      animalType: report.animalType,
      address: report.address,
      status: report.status,
      description: report.description,
    },
  };
}

/**
 * ReportDto配列をタイムラインGeoJSONに変換
 *
 * @param reports - 通報データの配列
 * @param estimatedDisplayDays - 推定表示日数（通報日からN日間表示を継続）
 * @returns タイムラインGeoJSON
 */
export function convertReportsToTimelineGeoJSON(
  reports: ReportDto[],
  estimatedDisplayDays: EstimatedDisplayDays = 7
): TimelineGeoJSON {
  // 無効な座標（0,0）の通報を除外
  const validReports = reports.filter(
    (report) => report.latitude !== 0 || report.longitude !== 0
  );

  return {
    type: 'FeatureCollection',
    features: validReports.map((report) =>
      convertReportToFeature(report, estimatedDisplayDays)
    ),
  };
}

/**
 * 通報データからタイムラインの表示範囲を計算
 *
 * @param reports - 通報データの配列
 * @param estimatedDisplayDays - 推定表示日数
 * @returns タイムライン範囲（開始・終了のUnixタイムスタンプ）
 */
export function calculateTimelineRange(
  reports: ReportDto[],
  estimatedDisplayDays: EstimatedDisplayDays = 7
): TimelineRange | null {
  if (reports.length === 0) {
    return null;
  }

  const dates = reports.map((report) => new Date(report.createdAt).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);

  // 範囲を調整（データの開始から最後の通報が消えるまで）
  const start = minDate;
  const end = maxDate + estimatedDisplayDays * 24 * 60 * 60 * 1000;

  return { start, end };
}

/**
 * Unixタイムスタンプを日本語の日付形式にフォーマット
 *
 * @param timestamp - Unixタイムスタンプ
 * @returns フォーマットされた日付文字列
 */
export function formatTimelineDate(timestamp: number): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(timestamp));
}
