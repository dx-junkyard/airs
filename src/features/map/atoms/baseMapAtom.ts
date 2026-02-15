import { atom } from 'jotai';

/**
 * ベースマップ定義
 *
 * 地図の背景タイルレイヤーの設定。
 * サムネイルURLはタイルURLのz=5, x=28, y=12（日本付近）を使用。
 */
export interface BaseMapDefinition {
  /** ベースマップのID */
  id: string;
  /** 表示名 */
  name: string;
  /** タイルレイヤーURL */
  url: string;
  /** 帰属表示 */
  attribution: string;
  /** サムネイル画像URL（タイルから生成） */
  thumbnailUrl: string;
}

/**
 * 利用可能なベースマップ一覧
 *
 * 順序: デフォルト（OSM標準）→ 地理院淡色 → 地理院標準 → 地理院写真
 */
export const BASE_MAPS: BaseMapDefinition[] = [
  {
    id: 'osm',
    name: '標準',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    thumbnailUrl: 'https://a.tile.openstreetmap.org/5/28/12.png',
  },
  {
    id: 'gsi-pale',
    name: '淡色',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
    thumbnailUrl: 'https://cyberjapandata.gsi.go.jp/xyz/pale/5/28/12.png',
  },
  {
    id: 'gsi-std',
    name: '地理院',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
    thumbnailUrl: 'https://cyberjapandata.gsi.go.jp/xyz/std/5/28/12.png',
  },
  {
    id: 'gsi-photo',
    name: '写真',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
    attribution:
      '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
    thumbnailUrl:
      'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/5/28/12.jpg',
  },
];

/** デフォルトのベースマップ（OpenStreetMap 標準） */
export const DEFAULT_BASE_MAP = BASE_MAPS[0];

/**
 * 現在選択中のベースマップIDを管理するatom
 *
 * BaseMapSelector で選択を切り替え、BaseReportMap の TileLayer に反映される。
 */
export const baseMapIdAtom = atom<string>(DEFAULT_BASE_MAP.id);

/**
 * 現在選択中のベースマップ定義を返す派生atom
 */
export const currentBaseMapAtom = atom<BaseMapDefinition>((get) => {
  const id = get(baseMapIdAtom);
  return BASE_MAPS.find((m) => m.id === id) ?? DEFAULT_BASE_MAP;
});
