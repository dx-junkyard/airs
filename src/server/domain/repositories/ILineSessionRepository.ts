import type { SimulationStep } from '@/features/ai-report/types';
import type { LineSessionState } from '@/features/line-bot/types/lineSession';

/**
 * LINE Botセッションデータ
 */
export interface LineSessionData {
  id: string;
  lineUserId: string;
  step: SimulationStep;
  state: LineSessionState;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

/**
 * LINE Botセッションリポジトリインターフェース
 */
export interface ILineSessionRepository {
  /**
   * LINE UserIDでセッションを取得
   * 期限切れのセッションは返さない
   */
  findByLineUserId(lineUserId: string): Promise<LineSessionData | null>;

  /**
   * セッションを保存（upsert）
   */
  save(
    lineUserId: string,
    step: SimulationStep,
    state: LineSessionState
  ): Promise<LineSessionData>;

  /**
   * セッションを削除
   */
  deleteByLineUserId(lineUserId: string): Promise<void>;

  /**
   * 期限切れセッションを一括削除
   */
  deleteExpired(): Promise<number>;
}
