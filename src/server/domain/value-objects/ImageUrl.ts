/**
 * ImageUrl値オブジェクト
 *
 * 画像URLまたはBase64エンコードされた画像データのバリデーションを行う。
 */
class ImageUrl {
  // Base64画像データの形式: data:image/...;base64,...
  private static readonly BASE64_IMAGE_REGEX =
    /^data:image\/(png|jpg|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/]+=*$/;

  // HTTPSまたはHTTPで始まるURL
  private static readonly URL_REGEX =
    /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp|svg)$/i;

  private constructor(private readonly _value: string) {}

  /**
   * 画像URL文字列からImageUrl値オブジェクトを生成
   * @param value 画像URLまたはBase64文字列
   * @returns ImageUrl値オブジェクト
   * @throws {Error} 不正な画像URL形式の場合
   */
  static create(value: string): ImageUrl {
    if (!value || value.trim() === '') {
      throw new Error('画像URLは必須です');
    }

    const trimmed = value.trim();

    const isBase64 = ImageUrl.BASE64_IMAGE_REGEX.test(trimmed);
    const isUrl = ImageUrl.URL_REGEX.test(trimmed);

    if (!isBase64 && !isUrl) {
      throw new Error('画像URLまたはBase64形式が正しくありません');
    }

    return new ImageUrl(trimmed);
  }

  /**
   * 画像URLの文字列表現を取得
   */
  get value(): string {
    return this._value;
  }

  /**
   * Base64形式かどうか
   */
  get isBase64(): boolean {
    return this._value.startsWith('data:image');
  }

  /**
   * URL形式かどうか
   */
  get isUrl(): boolean {
    return !this.isBase64;
  }

  /**
   * 画像形式を取得
   */
  get imageType(): string | undefined {
    if (this.isBase64) {
      const match = this._value.match(/^data:image\/(.*?);base64/);
      return match ? match[1] : undefined;
    }

    const match = this._value.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);
    return match ? match[1].toLowerCase() : undefined;
  }

  /**
   * 等価性の判定
   */
  equals(other: ImageUrl): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}

export default ImageUrl;
