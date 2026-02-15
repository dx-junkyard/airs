/**
 * ステータス別集計DTO
 */
export interface StatusCountDto {
  waiting: number;
  completed: number;
  total: number;
}

/**
 * 獣種別集計DTO
 * 動的な獣種キーをサポート（Record形式 + total）
 */
export interface AnimalTypeCountDto {
  [key: string]: number;
  total: number;
}

/**
 * 時系列データDTO
 */
export interface TimeSeriesDataDto {
  date: string; // YYYY-MM-DD
  count: number;
}

/**
 * 時系列獣種別データDTO
 * 動的な獣種キーをサポート（date + Record形式）
 */
export interface TimeSeriesAnimalDataDto {
  /** 日付（YYYY-MM-DD） */
  date: string;
  /** 獣種ごとの件数（動的キー） */
  [key: string]: string | number;
}

/**
 * エリア別集計DTO
 */
export interface AreaCountDto {
  /** エリア名（丁目まで） */
  areaKey: string;
  /** 地域名（都道府県 + 市区町村） */
  regionLabel: string;
  /** 表示用ラベル（丁目/町名） */
  chomeLabel: string;
  /** 件数 */
  count: number;
}

/**
 * 時間帯別獣種集計DTO
 * 動的な獣種キーをサポート（hour/label + Record形式）
 */
export interface HourlyAnimalDataDto {
  /** 時間（0-23） */
  hour: number;
  /** 表示ラベル（例: "00:00"） */
  label: string;
  /** 獣種ごとの件数（動的キー） */
  [key: string]: string | number;
}

/**
 * 直近のイベントサマリーDTO
 */
export interface RecentEventSummaryDto {
  /** イベントID */
  eventId: string;
  /** エリア名（丁目まで） */
  areaKey: string;
  /** 住所（areaKey未設定時のフォールバック） */
  address: string;
  /** 動物種別 */
  animalType: string;
  /** イベントに属する通報件数 */
  reportCount: number;
  /** イベント作成日時（ISO 8601） */
  createdAt: string;
  /** 担当職員ID */
  staffId?: string;
  /** 担当職員名 */
  staffName?: string;
}

/**
 * Report統計情報DTO
 *
 * 通報の統計情報を表すデータ転送オブジェクト。
 */
export interface ReportStatisticsDto {
  statusCount: StatusCountDto;
  animalTypeCount: AnimalTypeCountDto;
  timeSeriesData: TimeSeriesDataDto[];
  timeSeriesAnimalData: TimeSeriesAnimalDataDto[];
  areaRanking: AreaCountDto[];
  hourlyAnimalData: HourlyAnimalDataDto[];
  lastUpdated: string; // ISO 8601
}
