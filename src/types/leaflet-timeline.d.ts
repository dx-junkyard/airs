/**
 * Leaflet.timeline プラグインの型定義
 */

declare module 'leaflet.timeline' {
  import * as L from 'leaflet';
  import type { FeatureCollection, Point, Feature } from 'geojson';

  /** タイムラインのプロパティ */
  export interface TimelineProperties {
    /** 表示開始時刻 (ISO 8601形式またはUnixタイムスタンプ) */
    start: string | number;
    /** 表示終了時刻 (ISO 8601形式またはUnixタイムスタンプ) */
    end: string | number;
    /** その他のプロパティ */
    [key: string]: unknown;
  }

  /** タイムラインGeoJSONフィーチャー */
  export type TimelineFeature = Feature<Point, TimelineProperties>;

  /** タイムラインGeoJSONコレクション */
  export type TimelineGeoJSON = FeatureCollection<Point, TimelineProperties>;

  /** タイムラインレイヤーのオプション */
  export interface TimelineOptions extends L.GeoJSONOptions {
    /** GeoJSONからタイムスタンプの開始時刻を取得する関数 */
    getInterval?: (feature: TimelineFeature) => { start: number; end: number };
    /** ポイントマーカーを生成する関数 */
    pointToLayer?: (
      feature: TimelineFeature,
      latlng: L.LatLng
    ) => L.Layer | null;
    /** ライフサイクルイベントをトリガーするか */
    drawOnSetTime?: boolean;
  }

  /** タイムラインスライダーコントロールのオプション */
  export interface TimelineSliderControlOptions extends L.ControlOptions {
    /** タイムライン表示フォーマット関数 */
    formatOutput?: (time: number | Date) => string;
    /** 自動再生を有効にするか */
    enablePlayback?: boolean;
    /** 自動再生を使うかどうか（enablePlaybackと同じ） */
    enableKeyboardControls?: boolean;
    /** 再生速度のステップ配列 */
    steps?: number;
    /** 1ステップあたりの時間間隔（ミリ秒） */
    duration?: number;
    /** 最小値の取得関数 */
    showTicks?: boolean;
    /** 最大値の取得関数 */
    waitToUpdateMap?: boolean;
    /** 自動再生開始 */
    autoPlay?: boolean;
    /** ループ再生 */
    loop?: boolean;
    /** 閉じている時に表示するテキスト */
    collapseButtonContent?: string;
    /** 開いている時に表示するテキスト */
    expandButtonContent?: string;
  }

  /** タイムラインレイヤークラス */
  export class Timeline extends L.GeoJSON {
    constructor(geojson: TimelineGeoJSON, options?: TimelineOptions);
    /** タイムスタンプを設定 */
    setTime(time: number): this;
    /** 指定した時刻に設定 */
    getLayers(): L.Layer[];
    /** 現在の時刻を取得 */
    time: number;
    /** 時間の範囲を取得 */
    ranges: L.LatLngBounds;
    /** タイムスタンプの配列を取得 */
    times: number[];
    /** 表示範囲を取得 */
    start: number;
    end: number;
  }

  /** タイムラインスライダーコントロールクラス */
  export class TimelineSliderControl extends L.Control {
    constructor(options?: TimelineSliderControlOptions);
    /** タイムラインを追加 */
    addTimelines(...timelines: Timeline[]): this;
    /** タイムラインを削除 */
    removeTimelines(...timelines: Timeline[]): this;
    /** 現在時刻を設定 */
    setTime(time: number): void;
    /** タイムラインの表示範囲を設定 */
    container: HTMLElement;
    /** 再生開始 */
    play(): void;
    /** 再生停止 */
    pause(): void;
    /** 再生中かどうか */
    playing: boolean;
  }

  /** モジュールレベルの関数 */
  export function timeline(
    geojson: TimelineGeoJSON,
    options?: TimelineOptions
  ): Timeline;
  export function timelineSliderControl(
    options?: TimelineSliderControlOptions
  ): TimelineSliderControl;
}

declare namespace L {
  function timeline(
    geojson: import('leaflet.timeline').TimelineGeoJSON,
    options?: import('leaflet.timeline').TimelineOptions
  ): import('leaflet.timeline').Timeline;

  function timelineSliderControl(
    options?: import('leaflet.timeline').TimelineSliderControlOptions
  ): import('leaflet.timeline').TimelineSliderControl;
}
