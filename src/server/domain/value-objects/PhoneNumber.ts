/**
 * PhoneNumber値オブジェクト
 *
 * 電話番号のバリデーションロジックを内包する。
 * 日本の電話番号形式（ハイフンあり・なし両方対応）を想定。
 */
class PhoneNumber {
  // 数字とハイフンのみ許可（10-11桁の数字）
  private static readonly PHONE_REGEX = /^0\d{9,10}$|^0\d{1,4}-\d{1,4}-\d{4}$/;

  private constructor(private readonly _value: string) {}

  /**
   * 電話番号文字列からPhoneNumber値オブジェクトを生成
   * @param value 電話番号文字列（オプション）
   * @returns PhoneNumber値オブジェクトまたはundefined
   * @throws {Error} 不正な電話番号形式の場合
   */
  static create(value?: string): PhoneNumber | undefined {
    if (!value || value.trim() === '') {
      return undefined;
    }

    const normalized = value.trim();

    // ハイフンを除去して数字のみで検証
    const digitsOnly = normalized.replace(/-/g, '');
    const hasValidFormat = /^0\d{9,10}$/.test(digitsOnly);

    if (!hasValidFormat) {
      throw new Error('電話番号の形式が正しくありません');
    }

    return new PhoneNumber(normalized);
  }

  /**
   * 電話番号の文字列表現を取得
   */
  get value(): string {
    return this._value;
  }

  /**
   * 等価性の判定
   */
  equals(other: PhoneNumber): boolean {
    // ハイフンを除去して比較
    const thisDigits = this._value.replace(/-/g, '');
    const otherDigits = other._value.replace(/-/g, '');
    return thisDigits === otherDigits;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }
}

export default PhoneNumber;
