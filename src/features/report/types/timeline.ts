import type { FeatureCollection, Feature, Point } from 'geojson';

/**
 * タイムライン用のプロパティ
 */
export interface TimelineFeatureProperties {
  /** 表示開始時刻 (ISO 8601) */
  start: string;
  /** 表示終了時刻 (ISO 8601) */
  end: string;
  /** 通報ID */
  id: string;
  /** 動物種別 */
  animalType: string;
  /** 住所 */
  address: string;
  /** ステータス */
  status: string;
  /** 説明文 */
  description?: string;
  /** インデックスシグネチャ（leaflet.timelineとの互換性のため） */
  [key: string]: unknown;
}

/**
 * タイムライン用GeoJSONフィーチャー
 */
export type TimelineFeature = Feature<Point, TimelineFeatureProperties>;

/**
 * タイムライン用GeoJSONコレクション
 */
export type TimelineGeoJSON = FeatureCollection<
  Point,
  TimelineFeatureProperties
>;

/**
 * タイムラインの範囲情報
 */
export interface TimelineRange {
  /** 開始時刻 (Unixタイムスタンプ) */
  start: number;
  /** 終了時刻 (Unixタイムスタンプ) */
  end: number;
}

/**
 * 推定表示日数のオプション
 */
export type EstimatedDisplayDays = 3 | 7 | 14 | 30;

/**
 * タイムライン設定
 */
export interface TimelineSettings {
  /** 推定表示日数（目撃日から前後N日間） */
  estimatedDisplayDays: EstimatedDisplayDays;
}
