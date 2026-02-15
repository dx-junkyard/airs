/**
 * 獣種別のマーカー設定
 *
 * 共通定数から動的に生成
 */
import { ANIMAL_TYPES } from '@/server/domain/constants/animalTypes';

export const ANIMAL_MARKER_CONFIG: Record<
  string,
  { emoji: string; color: string; label: string }
> = Object.fromEntries(
  Object.entries(ANIMAL_TYPES).map(([key, config]) => [
    key,
    { emoji: config.emoji, color: config.color, label: config.label },
  ])
);
