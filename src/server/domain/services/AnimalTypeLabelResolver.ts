import {
  ANIMAL_TYPES,
  type AnimalTypeValue,
} from '@/server/domain/constants/animalTypes';

/**
 * カタカナラベル→コード値の逆引きMap
 */
const labelToCodeMap: Map<string, AnimalTypeValue> = new Map(
  Object.values(ANIMAL_TYPES).map((config) => [config.label, config.id])
);

/**
 * 有効なコード値のSet
 */
const validCodes = new Set<string>(Object.keys(ANIMAL_TYPES));

/**
 * AnimalTypeLabelResolver
 *
 * カタカナラベルまたはコード値を正規化されたコード値に変換する。
 * 例: "サル" → "monkey", "monkey" → "monkey"
 */
class AnimalTypeLabelResolver {
  /**
   * ラベルまたはコード値からコード値を解決する
   * @returns コード値。解決できない場合はundefined
   */
  resolve(input: string): AnimalTypeValue | undefined {
    const trimmed = input.trim();
    if (!trimmed) return undefined;

    // コード値としてそのまま有効な場合
    if (validCodes.has(trimmed)) {
      return trimmed as AnimalTypeValue;
    }

    // カタカナラベルからの逆引き
    return labelToCodeMap.get(trimmed);
  }
}

export default AnimalTypeLabelResolver;
