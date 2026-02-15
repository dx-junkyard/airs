/**
 * 画像リポジトリインターフェース
 *
 * 画像のアップロード・取得を抽象化
 */
export interface IImageRepository {
  /**
   * 画像をアップロードしてURLを取得
   * @param file アップロードする画像ファイル
   * @param filename ファイル名
   * @returns アップロードされた画像のURL
   */
  upload(file: File | Blob, filename: string): Promise<string>;

  /**
   * 画像URLが有効かどうかを確認
   * @param url 画像URL
   * @returns 有効な場合true
   */
  exists(url: string): Promise<boolean>;
}
