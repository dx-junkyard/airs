/**
 * 画像データ型
 *
 * URLとAI解析説明文のペア
 */
export interface ReportImage {
  url: string;
  description: string;
}

/**
 * ImageUrls値オブジェクト
 *
 * 画像URL配列のバリデーションロジックを内包し、
 * 不正な画像URLの生成を防ぐ。
 * 各画像にはAI解析説明文を付与可能。
 */
class ImageUrls {
  private static readonly URL_PATTERN = /^https?:\/\/.+$/;

  private constructor(private readonly _images: readonly ReportImage[]) {}

  /**
   * 画像データ配列からImageUrls値オブジェクトを生成
   * @param images 画像データ配列
   * @returns ImageUrls値オブジェクト
   * @throws {Error} 不正な画像URLの場合
   */
  static create(images: ReportImage[]): ImageUrls {
    if (!Array.isArray(images)) {
      throw new Error('画像データは配列である必要があります');
    }

    // 空配列は許可（写真なしの通報をサポート）
    if (images.length === 0) {
      return new ImageUrls([]);
    }

    // 各URLのバリデーション
    images.forEach((image, index) => {
      if (!image.url || image.url.trim() === '') {
        throw new Error(`画像URL[${index}]が空です`);
      }

      if (!ImageUrls.URL_PATTERN.test(image.url.trim())) {
        throw new Error(`不正なURL形式です: ${image.url}`);
      }
    });

    // トリムして不変配列として保存
    const trimmed = images.map((img) => ({
      url: img.url.trim(),
      description: img.description || '',
    }));
    return new ImageUrls(trimmed);
  }

  /**
   * URL文字列配列から生成（後方互換性用）
   * @param urls URL文字列配列
   * @param descriptions 説明文配列（オプション）
   */
  static fromUrls(urls: string[], descriptions?: string[]): ImageUrls {
    const images = urls.map((url, i) => ({
      url,
      description: descriptions?.[i] || '',
    }));
    return ImageUrls.create(images);
  }

  /**
   * 画像データ配列を取得
   */
  get images(): readonly ReportImage[] {
    return this._images;
  }

  /**
   * 画像URL配列を取得（後方互換性用）
   */
  get urls(): readonly string[] {
    return this._images.map((img) => img.url);
  }

  /**
   * 画像説明文配列を取得
   */
  get descriptions(): readonly string[] {
    return this._images.map((img) => img.description);
  }

  /**
   * 画像の数を取得
   */
  get count(): number {
    return this._images.length;
  }

  /**
   * 等価性の判定
   */
  equals(other: ImageUrls): boolean {
    if (this._images.length !== other._images.length) {
      return false;
    }
    return this._images.every(
      (img, index) =>
        img.url === other._images[index].url &&
        img.description === other._images[index].description
    );
  }

  /**
   * 文字列表現（カンマ区切り）
   */
  toString(): string {
    return this._images.map((img) => img.url).join(', ');
  }
}

export default ImageUrls;
