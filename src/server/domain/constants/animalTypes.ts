/**
 * 動物種別共通定数
 *
 * 獣種に関する定数を一元管理し、プロジェクト全体で統一された定義を提供。
 * 日本全国の鳥獣被害対策で報告される主要な野生動物を網羅。
 */

/** 動物種別の値型 */
export type AnimalTypeValue =
  // 哺乳類（在来種）
  | 'monkey'              // サル（ニホンザル）
  | 'deer'                // シカ（ニホンジカ）
  | 'wild_boar'           // イノシシ
  | 'bear'                // クマ（ツキノワグマ・ヒグマ）
  | 'raccoon_dog'         // タヌキ
  | 'fox'                 // キツネ
  | 'badger'              // アナグマ
  | 'masked_palm_civet'   // ハクビシン
  | 'hare'                // ノウサギ
  | 'serow'               // カモシカ（特別天然記念物）
  | 'marten'              // テン
  | 'weasel'              // イタチ（ニホンイタチ）
  | 'dog'                 // 犬
  | 'cat'                 // 猫
  // 哺乳類（特定外来生物）
  | 'raccoon'             // アライグマ
  | 'nutria'              // ヌートリア
  | 'muntjac'             // キョン
  | 'formosan_squirrel'   // タイワンリス
  | 'american_mink'       // アメリカミンク
  | 'mongoose'            // マングース（フイリマングース）
  | 'siberian_weasel'     // シベリアイタチ（チョウセンイタチ）
  // 鳥類
  | 'pheasant'
  | 'crow'                // カラス
  | 'bulbul'              // ヒヨドリ
  | 'starling'            // ムクドリ
  | 'sparrow'             // スズメ
  | 'duck'                // カモ
  | 'heron'               // サギ
  | 'cormorant'           // カワウ
  | 'kite'                // トビ
  | 'pigeon'              // ハト
  // その他
  | 'other';

/** 動物種別の設定インターフェース */
export interface AnimalTypeConfig {
  id: AnimalTypeValue;
  label: string;
  emoji: string;
  color: string;
  /** 分類（哺乳類・鳥類・その他） */
  category: 'mammal' | 'bird' | 'other';
}

/** 動物種別マスターデータ */
export const ANIMAL_TYPES: Record<AnimalTypeValue, AnimalTypeConfig> = {
  // ── 哺乳類（在来種） ──
  monkey:              { id: 'monkey',              label: 'サル',           emoji: '🐵', color: '#F59E0B', category: 'mammal' },
  deer:                { id: 'deer',                label: 'シカ',           emoji: '🦌', color: '#10B981', category: 'mammal' },
  wild_boar:           { id: 'wild_boar',           label: 'イノシシ',       emoji: '🐗', color: '#6366F1', category: 'mammal' },
  bear:                { id: 'bear',                label: 'クマ',           emoji: '🐻', color: '#EF4444', category: 'mammal' },
  raccoon_dog:         { id: 'raccoon_dog',         label: 'タヌキ',         emoji: '🦝', color: '#8B5CF6', category: 'mammal' },
  fox:                 { id: 'fox',                 label: 'キツネ',         emoji: '🦊', color: '#F97316', category: 'mammal' },
  badger:              { id: 'badger',              label: 'アナグマ',       emoji: '🦡', color: '#78716C', category: 'mammal' },
  masked_palm_civet:   { id: 'masked_palm_civet',   label: 'ハクビシン',     emoji: '🐾', color: '#A855F7', category: 'mammal' },
  hare:                { id: 'hare',                label: 'ノウサギ',       emoji: '🐇', color: '#14B8A6', category: 'mammal' },
  serow:               { id: 'serow',               label: 'カモシカ',       emoji: '🐐', color: '#0EA5E9', category: 'mammal' },
  marten:              { id: 'marten',              label: 'テン',           emoji: '🐾', color: '#D97706', category: 'mammal' },
  weasel:              { id: 'weasel',              label: 'イタチ',         emoji: '🐾', color: '#CA8A04', category: 'mammal' },
  dog:                 { id: 'dog',                 label: 'イヌ',           emoji: '🐕', color: '#854D0E', category: 'mammal' },
  cat:                 { id: 'cat',                 label: 'ネコ',           emoji: '🐈', color: '#9F1239', category: 'mammal' },
  // ── 哺乳類（特定外来生物） ──
  raccoon:             { id: 'raccoon',             label: 'アライグマ',     emoji: '🦝', color: '#EC4899', category: 'mammal' },
  nutria:              { id: 'nutria',              label: 'ヌートリア',     emoji: '🐀', color: '#84CC16', category: 'mammal' },
  muntjac:             { id: 'muntjac',             label: 'キョン',         emoji: '🦌', color: '#DC2626', category: 'mammal' },
  formosan_squirrel:   { id: 'formosan_squirrel',   label: 'タイワンリス',   emoji: '🐿️', color: '#4F46E5', category: 'mammal' },
  american_mink:       { id: 'american_mink',       label: 'アメリカミンク', emoji: '🐾', color: '#0F766E', category: 'mammal' },
  mongoose:            { id: 'mongoose',            label: 'マングース',     emoji: '🐾', color: '#BE185D', category: 'mammal' },
  siberian_weasel:     { id: 'siberian_weasel',     label: 'シベリアイタチ', emoji: '🐾', color: '#92400E', category: 'mammal' },
  // ── 鳥類（在来種） ──
  pheasant:            { id: 'pheasant',            label: 'キジ',           emoji: '🐓', color: '#15803D', category: 'bird' },
  crow:                { id: 'crow',                label: 'カラス',         emoji: '🐦', color: '#1E293B', category: 'bird' },
  bulbul:              { id: 'bulbul',              label: 'ヒヨドリ',       emoji: '🐦', color: '#65A30D', category: 'bird' },
  starling:            { id: 'starling',            label: 'ムクドリ',       emoji: '🐦', color: '#0891B2', category: 'bird' },
  sparrow:             { id: 'sparrow',             label: 'スズメ',         emoji: '🐦', color: '#B45309', category: 'bird' },
  duck:                { id: 'duck',                label: 'カモ',           emoji: '🦆', color: '#059669', category: 'bird' },
  heron:               { id: 'heron',               label: 'サギ',           emoji: '🐦', color: '#7C3AED', category: 'bird' },
  cormorant:           { id: 'cormorant',           label: 'カワウ',         emoji: '🐦', color: '#0369A1', category: 'bird' },
  kite:                { id: 'kite',                label: 'トビ',           emoji: '🦅', color: '#9333EA', category: 'bird' },
  pigeon:              { id: 'pigeon',              label: 'ハト',           emoji: '🕊️', color: '#64748B', category: 'bird' },
  // ── その他 ──
  other:               { id: 'other',               label: 'その他',         emoji: '❓', color: '#6B7280', category: 'other' },
} as const;

/**
 * 動物種別からラベルを取得
 * @param type 動物種別文字列
 * @returns 日本語ラベル
 */
export const getAnimalTypeLabel = (type: string): string =>
  ANIMAL_TYPES[type as AnimalTypeValue]?.label ?? 'その他';

/**
 * 動物種別から絵文字を取得
 * @param type 動物種別文字列
 * @returns 絵文字
 */
export const getAnimalTypeEmoji = (type: string): string =>
  ANIMAL_TYPES[type as AnimalTypeValue]?.emoji ?? '❓';

/**
 * 動物種別から色を取得
 * @param type 動物種別文字列
 * @returns 色コード
 */
export const getAnimalTypeColor = (type: string): string =>
  ANIMAL_TYPES[type as AnimalTypeValue]?.color ?? '#6B7280';

/** 動物種別オプション配列（UI選択肢用） */
export const ANIMAL_TYPE_OPTIONS = Object.values(ANIMAL_TYPES);

/** 有効な動物種別値のリスト */
export const VALID_ANIMAL_TYPES = Object.keys(ANIMAL_TYPES) as AnimalTypeValue[];

/** 動物カテゴリ種別 */
export type AnimalCategory =
  | 'native_mammal'
  | 'invasive_mammal'
  | 'bird'
  | 'other';

/** カテゴリグループ定義 */
export interface AnimalCategoryGroup {
  /** カテゴリ識別子 */
  category: AnimalCategory;
  /** 表示用ラベル */
  label: string;
  /** カテゴリに属する動物種別キー */
  keys: AnimalTypeValue[];
}

/** 動物種別のカテゴリグループ定義 */
export const ANIMAL_CATEGORY_GROUPS: AnimalCategoryGroup[] = [
  {
    category: 'native_mammal',
    label: '哺乳類（在来種）',
    keys: [
      'monkey',
      'deer',
      'wild_boar',
      'bear',
      'raccoon_dog',
      'fox',
      'badger',
      'masked_palm_civet',
      'hare',
      'serow',
      'marten',
      'weasel',
      'dog',
      'cat',
    ],
  },
  {
    category: 'invasive_mammal',
    label: '哺乳類（特定外来生物）',
    keys: [
      'raccoon',
      'nutria',
      'muntjac',
      'formosan_squirrel',
      'american_mink',
      'mongoose',
      'siberian_weasel',
    ],
  },
  {
    category: 'bird',
    label: '鳥類',
    keys: [
      'pheasant',
      'crow',
      'bulbul',
      'starling',
      'sparrow',
      'duck',
      'heron',
      'cormorant',
      'kite',
      'pigeon',
    ],
  },
  {
    category: 'other',
    label: 'その他',
    keys: ['other'],
  },
];

