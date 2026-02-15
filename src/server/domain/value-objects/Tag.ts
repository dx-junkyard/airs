/**
 * Tag値オブジェクト
 *
 * タグの正規化ルールを内包する。
 * 前後の空白を削除し、小文字に統一する。
 */
class Tag {
  private static readonly MAX_LENGTH = 50;

  private constructor(private readonly _value: string) {}

  /**
   * タグ文字列からTag値オブジェクトを生成
   * @param value タグ文字列
   * @returns Tag値オブジェクト
   * @throws {Error} 不正なタグ形式の場合
   */
  static create(value: string): Tag {
    if (!value || value.trim() === '') {
      throw new Error('タグは空にできません');
    }

    const normalized = value.trim().toLowerCase();

    if (normalized.length > Tag.MAX_LENGTH) {
      throw new Error(`タグは${Tag.MAX_LENGTH}文字以内にしてください`);
    }

    return new Tag(normalized);
  }

  /**
   * 複数のタグ文字列から配列を生成
   * @param values タグ文字列の配列
   * @returns Tag値オブジェクトの配列
   */
  static createMany(values?: string[]): Tag[] {
    if (!values || values.length === 0) {
      return [];
    }

    return values.filter((v) => v && v.trim() !== '').map((v) => Tag.create(v));
  }

  /**
   * タグの文字列表現を取得
   */
  get value(): string {
    return this._value;
  }

  /**
   * 等価性の判定
   */
  equals(other: Tag): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}

export default Tag;
