import type { SystemSettingValue } from '@/server/application/dtos/SystemSettingDto';

/**
 * システム設定リポジトリのインターフェース
 *
 * ログ形式でシステム設定を管理する。
 * 変更のたびに新しいレコードを追加し、最新のものを参照する。
 */
export interface ISystemSettingRepository {
  /**
   * 最新のシステム設定を取得
   * 設定が存在しない場合はnullを返す
   */
  findLatest(): Promise<SystemSettingValue | null>;

  /**
   * システム設定を新規追加
   * @param value 設定値
   */
  create(value: SystemSettingValue): Promise<SystemSettingValue>;
}
