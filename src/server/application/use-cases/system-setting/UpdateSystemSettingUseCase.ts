import type { ISystemSettingRepository } from '@/server/domain/repositories/ISystemSettingRepository';
import type {
  SystemSettingDto,
  SystemSettingValue,
} from '@/server/application/dtos/SystemSettingDto';
import { isMapDefaultDataRangeValue } from '@/server/domain/constants/mapDefaultDataRange';

/**
 * UpdateSystemSettingUseCase
 *
 * システム設定更新のユースケース
 */
class UpdateSystemSettingUseCase {
  constructor(private repository: ISystemSettingRepository) {}

  async execute(value: SystemSettingValue): Promise<SystemSettingDto> {
    // バリデーション
    if (value.eventClusteringTimeMinutes < 1) {
      throw new Error('グループ化の時間は1分以上で設定してください');
    }
    if (value.eventClusteringRadiusMeters < 1) {
      throw new Error('グループ化の半径は1m以上で設定してください');
    }
    if (value.lineSessionTimeoutHours < 1) {
      throw new Error('セッションタイムアウトは1時間以上で設定してください');
    }

    // JSON形式のバリデーション: string[]であること
    try {
      const parsed = JSON.parse(value.animalTypesJson);
      if (!Array.isArray(parsed)) {
        throw new Error('獣種設定は配列形式である必要があります');
      }
      if (parsed.length === 0) {
        throw new Error('獣種を1つ以上選択してください');
      }
      if (!parsed.every((item: unknown) => typeof item === 'string')) {
        throw new Error('獣種設定の要素はすべて文字列である必要があります');
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('獣種')) {
        throw e;
      }
      throw new Error('獣種設定のJSON形式が不正です');
    }

    // 地図デフォルト座標のバリデーション
    if (value.mapDefaultLatitude < -90 || value.mapDefaultLatitude > 90) {
      throw new Error('デフォルト緯度は-90〜90の範囲で設定してください');
    }
    if (value.mapDefaultLongitude < -180 || value.mapDefaultLongitude > 180) {
      throw new Error('デフォルト経度は-180〜180の範囲で設定してください');
    }
    if (!isMapDefaultDataRangeValue(value.mapDefaultDataRange)) {
      throw new Error('地図デフォルト表示期間の値が不正です');
    }

    // ドメイン知識のバリデーション（空文字許可、最大10,000文字）
    if (value.domainKnowledgeText.length > 10000) {
      throw new Error(
        'ドメイン知識は10,000文字以内で入力してください'
      );
    }

    // おすすめ質問のバリデーション
    try {
      const parsed = JSON.parse(value.suggestedQuestionsJson);
      if (!Array.isArray(parsed)) {
        throw new Error('おすすめ質問は配列形式である必要があります');
      }
      if (!parsed.every((item: unknown) => typeof item === 'string')) {
        throw new Error('おすすめ質問の要素はすべて文字列である必要があります');
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('おすすめ')) {
        throw e;
      }
      throw new Error('おすすめ質問のJSON形式が不正です');
    }

    const saved = await this.repository.create(value);

    return {
      id: 'latest',
      value: saved,
    };
  }
}

export default UpdateSystemSettingUseCase;
