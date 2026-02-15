import type {
  LineEventInput,
  LineResponseMessages,
} from '@/features/line-bot/types/lineMessages';
import type { LineSessionData } from '@/server/domain/repositories/ILineSessionRepository';

/**
 * ステップハンドラーの共通インターフェース
 */
export interface IStepHandler {
  handle(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages>;
}
