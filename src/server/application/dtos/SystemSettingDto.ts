import type { MapDefaultDataRangeValue } from '@/server/domain/constants/mapDefaultDataRange';

/**
 * システム設定値の型定義
 */
export interface SystemSettingValue {
  /** ジオフェンシング: 前方一致住所 */
  geofenceAddressPrefix: string;
  /** イベントクラスタリング: 初回通報からの時間（分） */
  eventClusteringTimeMinutes: number;
  /** イベントクラスタリング: 半径（メートル） */
  eventClusteringRadiusMeters: number;
  /** 獣種設定（JSON文字列: string[] 形式。AnimalTypeValueキーの配列） */
  animalTypesJson: string;
  /** LINEセッションタイムアウト（時間） */
  lineSessionTimeoutHours: number;
  /** 分析AIのおすすめ質問（JSON文字列: string[] 形式） */
  suggestedQuestionsJson: string;
  /** 地図のデフォルト緯度 */
  mapDefaultLatitude: number;
  /** 地図のデフォルト経度 */
  mapDefaultLongitude: number;
  /** 地図のデフォルト表示期間 */
  mapDefaultDataRange: MapDefaultDataRangeValue;
  /** 表示期間の終了日（YYYY-MM-DD）。未設定なら今日 */
  defaultDisplayEndDate?: string;
  /** AI分析ドメイン知識（システムプロンプトに結合される） */
  domainKnowledgeText: string;
}

/**
 * システム設定DTO
 */
export interface SystemSettingDto {
  id: string;
  value: SystemSettingValue;
}
