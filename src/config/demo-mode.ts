/**
 * デモモード設定
 *
 * NEXT_PUBLIC_DEMO_MODE=1 または true の場合にデモ向けUIを有効化する。
 * サーバー側では DEMO_MODE もフォールバックとして許可する。
 */
const demoModeValue =
  process.env.NEXT_PUBLIC_DEMO_MODE ?? process.env.DEMO_MODE;

export const isDemoMode =
  demoModeValue === 'true' || demoModeValue === '1';
