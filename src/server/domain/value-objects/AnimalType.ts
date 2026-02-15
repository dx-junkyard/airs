/**
 * AnimalType値オブジェクト
 *
 * 獣種の種類を表す値オブジェクト。
 * マスターデータは animalTypes.ts で一元管理。
 */

import {
  type AnimalTypeValue,
  VALID_ANIMAL_TYPES,
  getAnimalTypeLabel,
} from '@/server/domain/constants/animalTypes';

class AnimalType {
  private constructor(private readonly _value: AnimalTypeValue) {}

  /**
   * 文字列からAnimalType値オブジェクトを生成
   * @param value 獣種文字列
   * @returns AnimalType値オブジェクト
   * @throws {Error} 不正な獣種の場合
   */
  static create(value: string): AnimalType {
    if (!AnimalType.isValid(value)) {
      throw new Error(
        `不正な獣種です: ${value}。有効な値: ${VALID_ANIMAL_TYPES.join(', ')}`
      );
    }
    return new AnimalType(value);
  }

  /**
   * 有効な獣種値かどうかを判定
   */
  private static isValid(value: string): value is AnimalTypeValue {
    return VALID_ANIMAL_TYPES.includes(value as AnimalTypeValue);
  }

  /** 獣種の文字列表現を取得 */
  get value(): AnimalTypeValue {
    return this._value;
  }

  /** 日本語ラベルを取得 */
  get label(): string {
    return getAnimalTypeLabel(this._value);
  }

  /** 等価性の判定 */
  equals(other: AnimalType): boolean {
    return this._value === other._value;
  }

  /** 文字列表現 */
  toString(): string {
    return this._value;
  }
}

export default AnimalType;
