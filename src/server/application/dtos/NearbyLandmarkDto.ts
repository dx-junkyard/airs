/**
 * 周辺ランドマーク情報DTO
 *
 * 周辺施設検索結果のデータ転送用
 */
export interface NearbyLandmarkDto {
  /** ランドマークID（例: "osm_node_12345"） */
  id: string;
  /** ランドマーク名 */
  name: string;
  /** カテゴリ（例: "学校", "公園", "コンビニ"） */
  category: string;
  /** カテゴリキー（例: "school", "park", "convenience_store"） */
  categoryKey: string;
  /** カテゴリ絵文字 */
  emoji: string;
  /** 検索中心地点からの距離（メートル） */
  distance: number;
  /** 緯度 */
  latitude: number;
  /** 経度 */
  longitude: number;
}
