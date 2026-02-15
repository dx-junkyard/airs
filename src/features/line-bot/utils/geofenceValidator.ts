import DIContainer from '@/server/infrastructure/di/container';
import GetSystemSettingUseCase from '@/server/application/use-cases/system-setting/GetSystemSettingUseCase';

/**
 * ジオフェンシングバリデーション結果
 */
export interface GeofenceValidationResult {
  isAllowed: boolean;
  prefix: string;
}

/**
 * 住所がジオフェンシングの前方一致条件を満たすか検証する
 *
 * @param address 検証する住所
 * @returns バリデーション結果
 */
export async function validateGeofence(
  address: string
): Promise<GeofenceValidationResult> {
  const repository = DIContainer.getSystemSettingRepository();
  const useCase = new GetSystemSettingUseCase(repository);
  const setting = await useCase.execute();

  const prefix = setting.value.geofenceAddressPrefix;

  // プレフィックスが空の場合はジオフェンシング無効（常に許可）
  if (!prefix) {
    return { isAllowed: true, prefix: '' };
  }

  const isAllowed = address.startsWith(prefix);

  return { isAllowed, prefix };
}
