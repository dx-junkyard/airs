import type { ReportImage } from '@/server/domain/value-objects/ImageUrls';

/**
 * 通報パネル（サイドパネル・ドロワー）で使用する共通の通報情報型
 */
export interface BaseReportInfo {
  id: string;
  animalType: string;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string | Date;
  status: string;
  /** 電話番号（オプション） */
  phoneNumber?: string;
  /** 説明文（オプション） */
  description?: string;
  /** 画像データ配列（オプション） */
  images?: ReportImage[];
}

/**
 * 通報パネル共通のprops
 */
export interface ReportPanelBaseProps {
  /** 表示する通報情報 */
  report: BaseReportInfo;
  /** 閉じるボタン押下時のコールバック */
  onClose: () => void;
  /** 電話番号を表示するか（デフォルト: true） */
  showPhoneNumber?: boolean;
  /** 説明文を表示するか（デフォルト: true） */
  showDescription?: boolean;
  /** 画像を表示するか（デフォルト: true） */
  showImages?: boolean;
}
