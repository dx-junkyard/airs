'use server';

import DIContainer from '@/server/infrastructure/di/container';
import GetFacilitiesByStaffUseCase from '@/server/application/use-cases/facility/GetFacilitiesByStaffUseCase';
import GetAllFacilitiesUseCase from '@/server/application/use-cases/facility/GetAllFacilitiesUseCase';
import GetSharedFacilitiesUseCase from '@/server/application/use-cases/facility/GetSharedFacilitiesUseCase';
import RegisterFacilityUseCase from '@/server/application/use-cases/facility/RegisterFacilityUseCase';
import UnregisterFacilityUseCase from '@/server/application/use-cases/facility/UnregisterFacilityUseCase';
import ToggleFacilitySharedUseCase from '@/server/application/use-cases/facility/ToggleFacilitySharedUseCase';
import SearchNearbyLandmarksUseCase from '@/server/application/use-cases/geo/SearchNearbyLandmarksUseCase';
import type { FacilityDto } from '@/server/application/dtos/FacilityDto';
import type { CreateFacilityDto } from '@/server/application/dtos/CreateFacilityDto';
import type { NearbyLandmarkDto } from '@/server/application/dtos/NearbyLandmarkDto';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/features/common/utils/isAdmin';

/**
 * 職員の施設一覧を取得
 */
export async function getFacilitiesByStaff(
  staffId: string
): Promise<FacilityDto[]> {
  const repository = DIContainer.getFacilityRepository();
  const useCase = new GetFacilitiesByStaffUseCase(repository);
  return await useCase.execute(staffId);
}

/**
 * 全施設一覧を取得（削除済み除外）
 */
export async function getAllFacilities(): Promise<FacilityDto[]> {
  const repository = DIContainer.getFacilityRepository();
  const useCase = new GetAllFacilitiesUseCase(repository);
  return await useCase.execute();
}

/**
 * 全体共有の施設一覧を取得
 */
export async function getSharedFacilities(): Promise<FacilityDto[]> {
  const repository = DIContainer.getFacilityRepository();
  const useCase = new GetSharedFacilitiesUseCase(repository);
  return await useCase.execute();
}

/**
 * 周辺施設を検索（Overpass API）
 */
export async function searchFacilityLandmarks(
  lat: number,
  lng: number,
  radius: number = 1000
): Promise<NearbyLandmarkDto[]> {
  const geoRepository = DIContainer.getGeoRepository();
  const useCase = new SearchNearbyLandmarksUseCase(geoRepository);
  return await useCase.execute(lat, lng, radius);
}

/**
 * 施設を登録
 */
export async function registerFacility(
  dto: CreateFacilityDto
): Promise<FacilityDto> {
  requireAdmin();

  const repository = DIContainer.getFacilityRepository();
  const useCase = new RegisterFacilityUseCase(repository);
  const result = await useCase.execute(dto);

  revalidatePath('/admin/facility');

  return result;
}

/**
 * 施設を登録解除（論理削除）
 */
export async function unregisterFacility(facilityId: string): Promise<boolean> {
  requireAdmin();

  const repository = DIContainer.getFacilityRepository();
  const useCase = new UnregisterFacilityUseCase(repository);
  const result = await useCase.execute(facilityId);

  revalidatePath('/admin/facility');

  return result;
}

/**
 * 施設の全体共有フラグを切り替え
 */
export async function toggleFacilityShared(
  facilityId: string,
  isShared: boolean
): Promise<FacilityDto> {
  requireAdmin();

  const repository = DIContainer.getFacilityRepository();
  const useCase = new ToggleFacilitySharedUseCase(repository);
  const result = await useCase.execute(facilityId, isShared);

  revalidatePath('/admin/facility');

  return result;
}
