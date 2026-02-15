'use server';

import DIContainer from '@/server/infrastructure/di/container';
import GetSystemSettingUseCase from '@/server/application/use-cases/system-setting/GetSystemSettingUseCase';
import UpdateSystemSettingUseCase from '@/server/application/use-cases/system-setting/UpdateSystemSettingUseCase';
import type {
  SystemSettingDto,
  SystemSettingValue,
} from '@/server/application/dtos/SystemSettingDto';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/features/common/utils/isAdmin';
import {
  ANIMAL_TYPES,
  type AnimalTypeConfig,
  type AnimalTypeValue,
} from '@/server/domain/constants/animalTypes';
import {
  DEFAULT_MAP_DEFAULT_DATA_RANGE,
  isMapDefaultDataRangeValue,
} from '@/server/domain/constants/mapDefaultDataRange';

/**
 * システム設定を取得
 */
export async function getSystemSetting(): Promise<SystemSettingDto> {
  const repository = DIContainer.getSystemSettingRepository();
  const useCase = new GetSystemSettingUseCase(repository);
  return await useCase.execute();
}

/**
 * システム設定を更新
 */
export async function updateSystemSetting(
  formData: FormData
): Promise<SystemSettingDto> {
  requireAdmin();

  const mapDefaultDataRangeRaw =
    (formData.get('mapDefaultDataRange') as string) ?? '';
  const defaultDisplayEndDateRaw =
    (formData.get('defaultDisplayEndDate') as string) ?? '';

  const value: SystemSettingValue = {
    geofenceAddressPrefix: (formData.get('geofenceAddressPrefix') as string) ?? '',
    eventClusteringTimeMinutes: Number(formData.get('eventClusteringTimeMinutes')),
    eventClusteringRadiusMeters: Number(formData.get('eventClusteringRadiusMeters')),
    animalTypesJson: (formData.get('animalTypesJson') as string) ?? '[]',
    lineSessionTimeoutHours: Number(formData.get('lineSessionTimeoutHours')),
    suggestedQuestionsJson: (formData.get('suggestedQuestionsJson') as string) ?? '[]',
    mapDefaultLatitude: Number(formData.get('mapDefaultLatitude')),
    mapDefaultLongitude: Number(formData.get('mapDefaultLongitude')),
    mapDefaultDataRange: isMapDefaultDataRangeValue(mapDefaultDataRangeRaw)
      ? mapDefaultDataRangeRaw
      : DEFAULT_MAP_DEFAULT_DATA_RANGE,
    defaultDisplayEndDate: defaultDisplayEndDateRaw || undefined,
    domainKnowledgeText: (formData.get('domainKnowledgeText') as string) ?? '',
  };

  const repository = DIContainer.getSystemSettingRepository();
  const useCase = new UpdateSystemSettingUseCase(repository);
  const result = await useCase.execute(value);

  revalidatePath('/', 'layout');

  return result;
}

/**
 * システム設定で有効にされた獣種一覧を取得
 */
export async function getEnabledAnimalTypes(): Promise<AnimalTypeConfig[]> {
  const setting = await getSystemSetting();
  const keys: string[] = JSON.parse(setting.value.animalTypesJson);
  return keys
    .filter((key): key is AnimalTypeValue => key in ANIMAL_TYPES)
    .map((key) => ANIMAL_TYPES[key]);
}
