import type { AnimalTypeValue } from '@/features/ai-report/types';
import type {
  LineEventInput,
  LineResponseMessages,
} from '@/features/line-bot/types/lineMessages';
import type { LineSessionState } from '@/features/line-bot/types/lineSession';
import type {
  ILineSessionRepository,
  LineSessionData,
} from '@/server/domain/repositories/ILineSessionRepository';
import { parsePostbackData } from '@/features/line-bot/utils/postbackParser';
import { ACTION_SELECT_ANIMAL } from '@/features/line-bot/constants/postbackActions';
import {
  buildAnimalTypeMessage,
  buildPhotoPromptMessages,
} from '@/features/line-bot/services/LineMessageBuilder';
import {
  ANIMAL_TYPES,
  type AnimalTypeConfig,
} from '@/server/domain/constants/animalTypes';
import DIContainer from '@/server/infrastructure/di/container';
import GetSystemSettingUseCase from '@/server/application/use-cases/system-setting/GetSystemSettingUseCase';
import type { IStepHandler } from '@/features/line-bot/services/handlers/IStepHandler';

/**
 * Step 1: 動物種選択ハンドラー
 */
class AnimalTypeHandler implements IStepHandler {
  private cachedEnabledTypes: AnimalTypeConfig[] | null = null;

  constructor(private sessionRepo: ILineSessionRepository) {}

  /**
   * システム設定から有効な獣種を取得（リクエスト内でキャッシュ）
   */
  async getEnabledAnimalTypes(): Promise<AnimalTypeConfig[]> {
    if (this.cachedEnabledTypes) return this.cachedEnabledTypes;

    const repo = DIContainer.getSystemSettingRepository();
    const useCase = new GetSystemSettingUseCase(repo);
    const setting = await useCase.execute();
    const keys: string[] = JSON.parse(setting.value.animalTypesJson);
    this.cachedEnabledTypes = keys
      .filter((key): key is AnimalTypeValue => key in ANIMAL_TYPES)
      .map((key) => ANIMAL_TYPES[key]);
    return this.cachedEnabledTypes;
  }

  async handle(
    session: LineSessionData,
    event: LineEventInput
  ): Promise<LineResponseMessages> {
    if (event.type !== 'postback' || !event.postbackData) {
      const enabledTypes = await this.getEnabledAnimalTypes();
      return {
        replyMessages: [buildAnimalTypeMessage(enabledTypes)],
      };
    }

    const payload = parsePostbackData(event.postbackData);
    if (payload.action !== ACTION_SELECT_ANIMAL || !payload.value) {
      const enabledTypes = await this.getEnabledAnimalTypes();
      return {
        replyMessages: [buildAnimalTypeMessage(enabledTypes)],
      };
    }

    const animalType = payload.value as AnimalTypeValue;
    const newState: LineSessionState = {
      ...session.state,
      animalType,
    };
    await this.sessionRepo.save(session.lineUserId, 'photo', newState);

    return {
      replyMessages: buildPhotoPromptMessages(),
    };
  }
}

export default AnimalTypeHandler;
