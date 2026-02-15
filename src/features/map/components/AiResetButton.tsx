'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import {
  aiLandmarkResultsAtom,
  chatResetRequestAtom,
} from '@/features/analysis/atoms/analysisAtoms';
import { Z_MAP_CONTROLS } from '@/constants/z-index';

interface AiResetButtonProps {
  /** データパネルが開いている場合のオフセット（px） */
  bottomOffsetPx?: number;
  /** 右パネルが開いている場合のオフセット（px） */
  rightOffsetPx?: number;
}

/**
 * AI抽出結果とチャット履歴を一括リセットするボタン
 *
 * AIによる抽出結果が1件以上存在する場合のみ表示。
 * クリックで地図データ・チャット状態を即座に初期化する。
 */
export default function AiResetButton({
  bottomOffsetPx = 0,
  rightOffsetPx = 0,
}: AiResetButtonProps) {
  const aiLandmarkResults = useAtomValue(aiLandmarkResultsAtom);
  const setAiLandmarkResults = useSetAtom(aiLandmarkResultsAtom);
  const setChatResetRequest = useSetAtom(chatResetRequestAtom);

  if (aiLandmarkResults.length === 0) return null;

  const handleReset = () => {
    setAiLandmarkResults([]);
    setChatResetRequest(true);
  };

  return (
    <button
      type="button"
      onClick={handleReset}
      title="AI抽出結果とチャット履歴をリセットして通常表示に戻す"
      aria-label="AI抽出結果とチャット履歴をリセットして通常表示に戻す"
      className={`
        absolute flex h-[30px] cursor-pointer items-center justify-center
        rounded bg-green-700 px-2 text-xs font-bold whitespace-nowrap text-white
        shadow-md transition-colors
        hover:bg-green-800
      `}
      style={{
        zIndex: Z_MAP_CONTROLS,
        bottom: `${10 + bottomOffsetPx}px`,
        right: `${10 + rightOffsetPx}px`,
      }}
    >
      AI結果解除
    </button>
  );
}
