/**
 * Address値オブジェクト
 *
 * 住所のバリデーションロジックを内包し、
 * 不正な住所の生成を防ぐ。
 */
class Address {
  private static readonly MAX_LENGTH = 500;

  private constructor(private readonly _value: string) {}

  /**
   * 住所文字列からAddress値オブジェクトを生成
   * @param value 住所文字列
   * @returns Address値オブジェクト
   * @throws {Error} 不正な住所の場合
   */
  static create(value: string): Address {
    if (!value || value.trim() === '') {
      throw new Error('住所は必須です');
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length > Address.MAX_LENGTH) {
      throw new Error(`住所は${Address.MAX_LENGTH}文字以内で入力してください`);
    }

    return new Address(trimmedValue);
  }

  /**
   * 住所の文字列表現を取得
   */
  get value(): string {
    return this._value;
  }

  /**
   * 等価性の判定
   */
  equals(other: Address): boolean {
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}

export default Address;
