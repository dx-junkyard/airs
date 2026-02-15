/**
 * 施設カテゴリ共通定数
 *
 * 周辺施設のカテゴリ定義を一元管理し、プロジェクト全体で統一された定義を提供。
 */

/** 施設カテゴリの値型 */
export type FacilityCategoryValue =
  | 'school'
  | 'kindergarten'
  | 'parking'
  | 'hospital'
  | 'police'
  | 'fire_station'
  | 'park'
  | 'library'
  | 'community_center'
  | 'shrine'
  | 'temple'
  | 'station'
  | 'post_office'
  | 'convenience_store'
  | 'supermarket'
  | 'government_office'
  | 'sports_facility'
  | 'welfare_facility'
  | 'other';

/** 施設カテゴリの設定インターフェース */
export interface FacilityCategoryConfig {
  id: FacilityCategoryValue;
  label: string;
  emoji: string;
}

/** 施設カテゴリマスターデータ */
export const FACILITY_CATEGORIES: Record<
  FacilityCategoryValue,
  FacilityCategoryConfig
> = {
  school:            { id: 'school',            label: '学校',         emoji: '\u{1F3EB}' },
  kindergarten:      { id: 'kindergarten',      label: '幼稚園',       emoji: '\u{1F492}' },
  parking:           { id: 'parking',           label: '駐車場',       emoji: '\u{1F17F}\uFE0F' },
  hospital:          { id: 'hospital',          label: '病院',         emoji: '\u{1F3E5}' },
  police:            { id: 'police',            label: '交番・警察署', emoji: '\u{1F694}' },
  fire_station:      { id: 'fire_station',      label: '消防署',       emoji: '\u{1F692}' },
  park:              { id: 'park',              label: '公園',         emoji: '\u{1F333}' },
  library:           { id: 'library',           label: '図書館',       emoji: '\u{1F4DA}' },
  community_center:  { id: 'community_center',  label: '公民館',       emoji: '\u{1F3DB}\uFE0F' },
  shrine:            { id: 'shrine',            label: '神社',         emoji: '\u26E9\uFE0F' },
  temple:            { id: 'temple',            label: '寺院',         emoji: '\u{1F6D5}' },
  station:           { id: 'station',           label: '駅',           emoji: '\u{1F689}' },
  post_office:       { id: 'post_office',       label: '郵便局',       emoji: '\u{1F4EE}' },
  convenience_store: { id: 'convenience_store', label: 'コンビニ',     emoji: '\u{1F3EA}' },
  supermarket:       { id: 'supermarket',       label: 'スーパー',     emoji: '\u{1F6D2}' },
  government_office: { id: 'government_office', label: '役所',         emoji: '\u{1F3E2}' },
  sports_facility:   { id: 'sports_facility',   label: 'スポーツ施設', emoji: '\u26BD' },
  welfare_facility:  { id: 'welfare_facility',  label: '福祉施設',     emoji: '\u{1F91D}' },
  other:             { id: 'other',             label: 'その他',       emoji: '\u{1F4CD}' },
} as const;

/**
 * Overpass APIから返される日本語カテゴリ → 英語キー変換マップ
 */
const OVERPASS_CATEGORY_MAP: Record<string, FacilityCategoryValue> = {
  '学校': 'school',
  '小学校': 'school',
  '中学校': 'school',
  '高校': 'school',
  '高等学校': 'school',
  '大学': 'school',
  '幼稚園': 'kindergarten',
  '保育園': 'kindergarten',
  '保育所': 'kindergarten',
  '認定こども園': 'kindergarten',
  '駐車場': 'parking',
  '病院': 'hospital',
  '診療所': 'hospital',
  'クリニック': 'hospital',
  '医院': 'hospital',
  '交番': 'police',
  '警察署': 'police',
  '駐在所': 'police',
  '消防署': 'fire_station',
  '公園': 'park',
  '図書館': 'library',
  '公民館': 'community_center',
  '集会所': 'community_center',
  'コミュニティセンター': 'community_center',
  '神社': 'shrine',
  '寺院': 'temple',
  '寺': 'temple',
  '駅': 'station',
  '郵便局': 'post_office',
  'コンビニ': 'convenience_store',
  'コンビニエンスストア': 'convenience_store',
  'スーパー': 'supermarket',
  'スーパーマーケット': 'supermarket',
  '役所': 'government_office',
  '市役所': 'government_office',
  '区役所': 'government_office',
  '町役場': 'government_office',
  '村役場': 'government_office',
  '役場': 'government_office',
  '出張所': 'government_office',
  'スポーツ施設': 'sports_facility',
  '体育館': 'sports_facility',
  '運動場': 'sports_facility',
  'グラウンド': 'sports_facility',
  'プール': 'sports_facility',
  '福祉施設': 'welfare_facility',
  '介護施設': 'welfare_facility',
  'デイサービス': 'welfare_facility',
  '老人ホーム': 'welfare_facility',
};

/**
 * 施設カテゴリから日本語ラベルを取得
 */
export const getFacilityCategoryLabel = (category: string): string =>
  FACILITY_CATEGORIES[category as FacilityCategoryValue]?.label ?? 'その他';

/**
 * 施設カテゴリから絵文字を取得
 */
export const getFacilityCategoryEmoji = (category: string): string =>
  FACILITY_CATEGORIES[category as FacilityCategoryValue]?.emoji ?? '\u{1F4CD}';

/** 施設カテゴリオプション配列（UI選択肢用） */
export const FACILITY_CATEGORY_OPTIONS = Object.values(FACILITY_CATEGORIES);

/**
 * Overpass APIの日本語カテゴリを英語キーに変換
 *
 * 完全一致 → 部分一致の順で検索する。
 */
export const mapOverpassCategoryToKey = (
  japaneseCategory: string
): FacilityCategoryValue => {
  // 完全一致
  if (japaneseCategory in OVERPASS_CATEGORY_MAP) {
    return OVERPASS_CATEGORY_MAP[japaneseCategory];
  }

  // 部分一致（日本語カテゴリを含む場合）
  for (const [jpKey, value] of Object.entries(OVERPASS_CATEGORY_MAP)) {
    if (japaneseCategory.includes(jpKey)) {
      return value;
    }
  }

  return 'other';
};
