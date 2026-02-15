import type { ISystemSettingRepository } from '@/server/domain/repositories/ISystemSettingRepository';
import type { SystemSettingDto } from '@/server/application/dtos/SystemSettingDto';
import {
  DEFAULT_MAP_DEFAULT_DATA_RANGE,
  isMapDefaultDataRangeValue,
} from '@/server/domain/constants/mapDefaultDataRange';

/**
 * GetSystemSettingUseCase
 *
 * システム設定取得のユースケース
 */
class GetSystemSettingUseCase {
  constructor(private repository: ISystemSettingRepository) {}

  async execute(): Promise<SystemSettingDto> {
    const value = await this.repository.findLatest();

    if (!value) {
      throw new Error(
        'システム設定が見つかりません。pnpm run db:seed:setting を実行してください。'
      );
    }

    const mapDefaultDataRange = isMapDefaultDataRangeValue(
      String(value.mapDefaultDataRange)
    )
      ? value.mapDefaultDataRange
      : DEFAULT_MAP_DEFAULT_DATA_RANGE;

    return {
      id: 'latest',
      value: {
        ...value,
        mapDefaultDataRange,
      },
    };
  }
}

export default GetSystemSettingUseCase;
