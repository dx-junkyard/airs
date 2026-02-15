/**
 * 最新のパスワード登録情報
 */
export interface AdminPasswordInfo {
  staffName: string;
  createdAt: string; // ISO 8601
}

/**
 * AdminPasswordリポジトリのインターフェース
 *
 * データリセット用パスワードの永続化を抽象化する。
 */
export interface IAdminPasswordRepository {
  /**
   * 新しいパスワードハッシュを保存する
   * 既存のアクティブなレコードはsoft-deleteする
   */
  create(hashedPassword: string, staffId: string): Promise<void>;

  /**
   * 最新のアクティブなパスワードハッシュを取得する
   * @returns hashedPassword。存在しない場合はundefined
   */
  findLatest(): Promise<string | undefined>;

  /**
   * 最新のパスワード登録者情報を取得する
   * @returns 登録者名と日時。存在しない場合はundefined
   */
  findLatestInfo(): Promise<AdminPasswordInfo | undefined>;
}
